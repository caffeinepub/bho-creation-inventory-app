import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";


import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

// Specify the migration function in the with-clause

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

  public type UserAccount = {
    profile : UserProfile;
    password : Text;
  };

  public type FabricEntry = {
    itemType : Text; // New field to distinguish item type (fabric, thread, etc.)
    fabricName : Text;
    quantity : Float;
    unit : Text; // New field for measurement units (meters, pieces, etc.)
    fabricPhoto : ?Storage.ExternalBlob;
    purchaseDate : ?Int;
    billPhoto : ?Storage.ExternalBlob;
  };

  type UpdateFabricData = {
    itemType : Text; // Added itemType to update data
    fabricName : Text;
    quantity : Float;
    unit : Text; // Added unit to update data
    fabricPhoto : ?Storage.ExternalBlob;
    purchaseDate : ?Int;
    billPhoto : ?Storage.ExternalBlob;
  };

  public type AuditLogEntry = {
    userId : Text;
    action : Text;
    fabricName : Text;
    rackId : Text;
    quantity : Float;
    timestamp : Int;
  };

  let userAccounts = Map.empty<Principal, UserAccount>();
  let auditLog = List.empty<AuditLogEntry>();
  let inventory = Map.empty<Text, FabricEntry>();

  func mapToInternalRole(role : Text) : ?UserRole {
    switch (role) {
      case ("admin") { ?#admin };
      case ("office") { ?#user };
      case ("worker") { ?#guest };
      case (_) { null };
    };
  };

  public shared ({ caller }) func promoteToMasterAdmin(masterAdminMetadata : {
    name : Text;
    username : Text;
    password : Text;
  }) : async Text {
    if (userAccounts.size() > 0) {
      Runtime.trap("Unauthorized: Master Admin already exists. This function can only be used for initial setup.");
    };

    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot become Master Admin");
    };

    let masterAdminProfile = {
      name = masterAdminMetadata.name;
      username = masterAdminMetadata.username;
      role = #admin : UserRole;
    };

    let masterAdminAccount = {
      profile = masterAdminProfile;
      password = masterAdminMetadata.password;
    };

    userAccounts.add(caller, masterAdminAccount);

    AccessControl.assignRole(accessControlState, caller, caller, #admin);

    "Master admin created successfully! You now have full access to all administrative features. Use your privileges wisely to manage users, assign roles, and maintain the system. Remember to always follow best practices for security and governance.";
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    switch (userAccounts.get(caller)) {
      case (null) { null };
      case (?account) { ?account.profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (userAccounts.get(user)) {
      case (null) { null };
      case (?account) { ?account.profile };
    };
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userAccounts.toArray().map(func((principal, account)) { (principal, account.profile) });
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    switch (userAccounts.get(caller)) {
      case (null) {
        Runtime.trap("User account not found. Please check your credentials or contact support if the issue persists.",);
      };
      case (?account) {
        if (AccessControl.hasPermission(accessControlState, caller, #user)) {
          let updatedAccount = { account with profile };
          userAccounts.add(caller, updatedAccount);
        } else {
          Runtime.trap("Unauthorized: Only users can save profiles");
        };
      };
    };
  };

  public shared ({ caller }) func addFabricEntry(rackId : Text, entryData : {
    itemType : Text;
    fabricName : Text;
    quantity : Float;
    unit : Text;
    fabricPhoto : ?Storage.ExternalBlob;
    purchaseDate : ?Int;
    billPhoto : ?Storage.ExternalBlob;
  }) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can add entries");
    };
    let entry : FabricEntry = {
      itemType = entryData.itemType;
      fabricName = entryData.fabricName;
      quantity = entryData.quantity;
      unit = entryData.unit;
      fabricPhoto = entryData.fabricPhoto;
      purchaseDate = entryData.purchaseDate;
      billPhoto = entryData.billPhoto;
    };
    inventory.add(rackId, entry);
    addAuditLogEntry(caller, "Added Item", entryData.fabricName, rackId, entryData.quantity);
    "Item successfully added!";
  };

  public shared ({ caller }) func updateFabricEntry(rackId : Text, updatedData : UpdateFabricData) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can update entries");
    };

    switch (inventory.get(rackId)) {
      case (null) { "Entry with ID '" # rackId # "' does not exist." };
      case (?_) {
        let updatedEntry : FabricEntry = {
          itemType = updatedData.itemType;
          fabricName = updatedData.fabricName;
          quantity = updatedData.quantity;
          unit = updatedData.unit;
          fabricPhoto = updatedData.fabricPhoto;
          purchaseDate = updatedData.purchaseDate;
          billPhoto = updatedData.billPhoto;
        };
        inventory.add(rackId, updatedEntry);
        "Entry updated successfully!";
      };
    };
  };

  public shared ({ caller }) func adjustQuantity(rackId : Text, quantityChange : Float) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can adjust quantities");
    };
    switch (inventory.get(rackId)) {
      case (null) { "Entry not found" };
      case (?item) {
        let newQuantity = item.quantity + quantityChange;
        if (newQuantity < 0) {
          "Quantity adjustment failed: Final quantity cannot be negative!";
        } else {
          let updatedItem = { item with quantity = newQuantity };
          inventory.add(rackId, updatedItem);

          let changeType = if (quantityChange > 0) {
            "increased";
          } else {
            "deducted";
          };
          addAuditLogEntry(
            caller,
            "Adjusted Quantity (" # changeType # ")",
            item.fabricName,
            rackId,
            quantityChange,
          );
          "Quantity " # changeType # " successfully!";
        };
      };
    };
  };

  public shared ({ caller }) func updateFabricQuantity(rackId : Text, usedQuantity : Float) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can update quantities");
    };
    switch (inventory.get(rackId)) {
      case (null) { "Not found" };
      case (?item) {
        if (usedQuantity > item.quantity) {
          "Used amount cannot be more than available!";
        } else {
          let updatedItem = { item with quantity = item.quantity - usedQuantity };
          inventory.add(rackId, updatedItem);
          addAuditLogEntry(caller, "Updated Quantity", item.fabricName, rackId, usedQuantity);
          "Item successfully updated!";
        };
      };
    };
  };

  public shared ({ caller }) func removeFabricEntry(rackId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can remove entries");
    };
    switch (inventory.get(rackId)) {
      case (null) { "Not found" };
      case (?item) {
        inventory.remove(rackId);
        addAuditLogEntry(caller, "Removed Item", item.fabricName, rackId, item.quantity);
        "Item successfully removed!";
      };
    };
  };

  func isValidPassword(password : Text) : Bool {
    password.size() >= 8;
  };

  public shared ({ caller }) func createUser(userPrincipal : Principal, name : Text, username : Text, password : Text, role : Text) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only Master Admin can create users");
    };

    switch (mapToInternalRole(role)) {
      case (null) { Runtime.trap("Invalid role format") };
      case (?_) {};
    };

    if (not isValidPassword(password)) {
      Runtime.trap("Your password should contain at least 8 characters; please try again with a valid password.",);
    };

    if (userAccounts.containsKey(userPrincipal)) {
      Runtime.trap("User already exists");
    };

    let internalRole = switch (mapToInternalRole(role)) {
      case (null) { Runtime.trap("Invalid role format") };
      case (?r) { r };
    };

    let userProfile : UserProfile = { name; username; role = internalRole };
    let userAccount : UserAccount = { profile = userProfile; password };

    userAccounts.add(userPrincipal, userAccount);

    AccessControl.assignRole(accessControlState, caller, userPrincipal, internalRole);

    addAuditLogEntry(caller, "Created User: " # username, "", "", 0);
    "User successfully created!";
  };

  public shared ({ caller }) func assignUserRole(userPrincipal : Principal, role : Text) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only Master Admin can assign roles");
    };

    let internalRole = switch (mapToInternalRole(role)) {
      case (null) { Runtime.trap("Invalid role format") };
      case (?r) { r };
    };

    AccessControl.assignRole(accessControlState, caller, userPrincipal, internalRole);

    switch (userAccounts.get(userPrincipal)) {
      case (null) {
        Runtime.trap("User profile not found. Please verify user existence.");
      };
      case (?account) {
        let updatedProfile = { account.profile with role = internalRole };
        let updatedAccount = { account with profile = updatedProfile };
        userAccounts.add(userPrincipal, updatedAccount);
      };
    };
    addAuditLogEntry(caller, "Assigned Role: " # role, "", "", 0);
    "Role successfully assigned!";
  };

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

  public query ({ caller }) func getAllInventoryFabricEntries() : async [(Text, FabricEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can view all inventory entries");
    };
    inventory.toArray();
  };

  public query ({ caller }) func getAuditLog() : async [AuditLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can view audit logs");
    };
    auditLog.toArray();
  };

  public query ({ caller }) func getInventory() : async [(Text, FabricEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only Master Admin and Office Staff can view inventory");
    };
    inventory.toArray();
  };

  public type LoginResult = {
    #success : UserProfile;
    #error : Text;
  };

  public shared query ({ caller }) func loginWithCredentials(username : Text, password : Text) : async LoginResult {
    // Allow anonymous callers since this is the authentication entry point
    // Note: This creates a parallel authentication system outside of IC's Principal-based auth
    // In production, consider using Internet Identity or similar instead

    var foundAccount : ?UserAccount = null;
    for ((principal, account) in userAccounts.entries()) {
      if (account.profile.username == username) {
        foundAccount := ?account;
      };
    };

    switch (foundAccount) {
      case (null) {
        // Use generic error message to prevent username enumeration
        #error("Invalid credentials. Please check your username and password.");
      };
      case (?account) {
        if (account.password == password) {
          #success(account.profile);
        } else {
          // Use same generic error message to prevent username enumeration
          #error("Invalid credentials. Please check your username and password.");
        };
      };
    };
  };
};
