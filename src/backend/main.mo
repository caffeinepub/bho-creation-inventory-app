import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Iter "mo:core/Iter";

import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

// New admin setup helper.

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = AccessControl.UserRole;

  public type UserProfile = {
    name : Text;
    username : Text;
    role : UserRole;
  };

  public type FabricInventoryEntry = {
    fabricName : Text;
    rackId : Text;
    quantity : Float;
    fabricPhoto : ?Storage.ExternalBlob;
    purchaseDate : ?Int;
    billPhoto : ?Storage.ExternalBlob;
  };

  type AuditLogEntry = {
    userId : Text;
    action : Text;
    fabricName : Text;
    rackId : Text;
    quantity : Float;
    timestamp : Int;
  };

  // Store persistent state as internal Map
  var auditLog = List.empty<AuditLogEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let inventory = Map.empty<Text, FabricInventoryEntry>();

  // REQUIRED. One-time admin setup (triggers on empty actor).
  // This function can ONLY be called once when no users exist in the system.
  // It bootstraps the first Master Admin who can then manage all other users.
  public shared ({ caller }) func promoteToMasterAdmin(masterAdminMetadata : {
    name : Text;
    username : Text;
  }) : async Text {
    // Security: Only allow this if NO users exist yet (initial bootstrap)
    if (userProfiles.size() > 0) {
      Runtime.trap("Unauthorized: Master Admin already exists. This function can only be used for initial setup.");
    };

    // Prevent anonymous principals from becoming admin
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot become Master Admin");
    };

    // Set up user profile.
    let adminProfile = {
      name = masterAdminMetadata.name;
      username = masterAdminMetadata.username;
      role = #admin : UserRole;
    };
    userProfiles.add(caller, adminProfile);

    // Assign admin role to internal access control state.
    AccessControl.assignRole(accessControlState, caller, caller, #admin);

    "Master admin created successfully! You now have full access to all administrative features. Use your privileges wisely to manage users, assign roles, and maintain the system. Remember to always follow best practices for security and governance.";
  };

  // Mapping external role representations to internal AccessControl.UserRole
  func mapToInternalRole(role : Text) : ?UserRole {
    switch (role) {
      case ("admin") { ?#admin };
      case ("office") { ?#user };
      case ("worker") { ?#guest };
      case (_) { null };
    };
  };

  func getInternalRole(role : UserRole) : Text {
    switch (role) {
      case (#admin) { "admin" };
      case (#user) { "office" };
      case (#guest) { "worker" };
    };
  };

  // User Profile Management (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Provide a method to query all users (requires admin privileges)
  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.toArray();
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Core functionality - Fabric Management
  // Master Admin and Office Staff can add fabric entries.
  public shared ({ caller }) func addFabricEntry(rackId : Text, fabric : {
    fabricName : Text;
    quantity : Float;
    fabricPhoto : ?Storage.ExternalBlob;
    purchaseDate : ?Int;
    billPhoto : ?Storage.ExternalBlob;
  }) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can add fabric entries");
    };
    let entry : FabricInventoryEntry = {
      fabricName = fabric.fabricName;
      rackId;
      quantity = fabric.quantity;
      fabricPhoto = fabric.fabricPhoto;
      purchaseDate = fabric.purchaseDate;
      billPhoto = fabric.billPhoto;
    };
    inventory.add(rackId, entry);
    addAuditLogEntry(caller, "Added Fabric", fabric.fabricName, rackId, fabric.quantity);
    "Fabric successfully added!";
  };

  // Master Admin, Office Staff, and Workers can update fabric quantities.
  public shared ({ caller }) func updateFabricQuantity(rackId : Text, usedQuantity : Float) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot update fabric quantities");
    };
    switch (inventory.get(rackId)) {
      case (null) { "Not found" };
      case (?fabric) {
        if (usedQuantity > fabric.quantity) {
          "Used amount cannot be more than available!";
        } else {
          let updatedFabric = { fabric with quantity = fabric.quantity - usedQuantity };
          inventory.add(rackId, updatedFabric);
          addAuditLogEntry(caller, "Updated Quantity", fabric.fabricName, rackId, usedQuantity);
          "Fabric successfully updated!";
        };
      };
    };
  };

  // Master Admin and Office Staff can remove fabric entries.
  public shared ({ caller }) func removeFabricEntry(rackId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can remove fabric entries");
    };
    switch (inventory.get(rackId)) {
      case (null) { "Not found" };
      case (?fabric) {
        inventory.remove(rackId);
        addAuditLogEntry(caller, "Removed Fabric", fabric.fabricName, rackId, fabric.quantity);
        "Fabric successfully removed!";
      };
    };
  };

  // User management - Only Master Admin can create users.
  public shared ({ caller }) func createUser(userPrincipal : Principal, name : Text, username : Text, role : Text) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only Master Admin can create users");
    };

    if (userProfiles.containsKey(userPrincipal)) {
      Runtime.trap("User already exists");
    };

    let internalRole = switch (mapToInternalRole(role)) {
      case (null) { Runtime.trap("Invalid role format") };
      case (?r) { r };
    };

    let profile = {
      name;
      username;
      role = internalRole;
    };
    userProfiles.add(userPrincipal, profile);

    // Assign the role in the access control system.
    AccessControl.assignRole(accessControlState, caller, userPrincipal, internalRole);

    addAuditLogEntry(caller, "Created User: " # username, "", "", 0);
    "User successfully created!";
  };

  // Only Master Admin can assign/change roles.
  public shared ({ caller }) func assignUserRole(userPrincipal : Principal, role : Text) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only Master Admin can assign roles");
    };

    let internalRole = switch (mapToInternalRole(role)) {
      case (null) { Runtime.trap("Invalid role format") };
      case (?r) { r };
    };

    AccessControl.assignRole(accessControlState, caller, userPrincipal, internalRole);

    // Update user profile if exists
    switch (userProfiles.get(userPrincipal)) {
      case (?profile) {
        let updatedProfile = { profile with role = internalRole };
        userProfiles.add(userPrincipal, updatedProfile);
      };
      case (null) { };
    };

    addAuditLogEntry(caller, "Assigned Role: " # role, "", "", 0);
    "Role successfully assigned!";
  };

  // Only Master Admin can list all users.
  public query ({ caller }) func getAllInventoryFabricEntries() : async [(Text, FabricInventoryEntry)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only Master Admin can view all users");
    };
    inventory.toArray();
  };

  // Audit log management
  func addAuditLogEntry(callerPrincipal : Principal, action : Text, fabricName : Text, rackId : Text, quantity : Float) {
    let userId = callerPrincipal.toText();
    let entry = {
      userId;
      action;
      fabricName;
      rackId;
      quantity;
      timestamp = Time.now();
    };
    auditLog.add(entry);
  };

  // Queries - Master Admin and Office Staff can view audit logs
  public query ({ caller }) func getAuditLog() : async [AuditLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can view audit logs");
    };
    auditLog.toArray();
  };

  // All authenticated users (including Workers) can view inventory
  public query ({ caller }) func getInventory() : async [(Text, FabricInventoryEntry)] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view inventory");
    };
    inventory.toArray();
  };
};
