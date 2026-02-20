import { useState } from 'react';
import { useGetAllUsers, useCreateUser, usePromoteToMasterAdmin } from '../hooks/useQueries';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Edit, Shield, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';
import UserEditModal from '../components/UserEditModal';
import { Principal } from '@dfinity/principal';
import { UserRole } from '../backend';

export default function AdminPanel() {
  const { data: currentUserProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: users, isLoading, error } = useGetAllUsers();
  const createUserMutation = useCreateUser();
  const promoteToMasterAdminMutation = usePromoteToMasterAdmin();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPrincipal, setNewUserPrincipal] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('worker');

  const [promotionPassword, setPromotionPassword] = useState('');
  const [showPromotionPasswordInput, setShowPromotionPasswordInput] = useState(false);

  const [editingUser, setEditingUser] = useState<{ principal: Principal; name: string; username: string; role: UserRole } | null>(null);

  const isAdmin = currentUserProfile?.role === UserRole.admin;
  const showSelfPromotion = !profileLoading && currentUserProfile && !isAdmin;

  const handlePromoteToMasterAdmin = async () => {
    if (!currentUserProfile) {
      toast.error('User profile not found');
      return;
    }

    if (!showPromotionPasswordInput) {
      setShowPromotionPasswordInput(true);
      return;
    }

    if (!promotionPassword.trim() || promotionPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      const result = await promoteToMasterAdminMutation.mutateAsync({
        username: currentUserProfile.username,
        name: currentUserProfile.name,
        password: promotionPassword,
      });
      toast.success('Successfully promoted to Master Admin!');
      setPromotionPassword('');
      setShowPromotionPasswordInput(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to promote to Master Admin');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[AdminPanel] Create User form submitted at', new Date().toISOString());
    console.log('[AdminPanel] Form data:', {
      name: newUserName,
      username: newUserUsername,
      principal: newUserPrincipal,
      role: newUserRole,
      passwordLength: newUserPassword.length,
    });

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPrincipal.trim() || !newUserPassword.trim()) {
      console.log('[AdminPanel] Validation failed: Empty fields');
      toast.error('Please fill in all fields');
      return;
    }

    if (newUserPassword.length < 8) {
      console.log('[AdminPanel] Validation failed: Password too short');
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Validate principal format
    let principal: Principal;
    try {
      principal = Principal.fromText(newUserPrincipal.trim());
      console.log('[AdminPanel] Principal validated successfully:', principal.toString());
    } catch (error) {
      console.error('[AdminPanel] Principal validation failed:', error);
      toast.error('Invalid principal ID format');
      return;
    }

    // Check if username is unique
    const existingUsernames = users?.map(([_, profile]) => profile.username) || [];
    if (existingUsernames.includes(newUserUsername.trim())) {
      console.log('[AdminPanel] Validation failed: Username already exists');
      toast.error('Username already exists');
      return;
    }

    console.log('[AdminPanel] All validations passed, calling mutation...');

    try {
      const result = await createUserMutation.mutateAsync({
        userPrincipal: principal,
        name: newUserName.trim(),
        username: newUserUsername.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
      });
      console.log('[AdminPanel] Mutation completed successfully:', result);
      toast.success('User created successfully');
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserPrincipal('');
      setNewUserRole('worker');
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('[AdminPanel] Mutation failed:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.admin:
        return 'Master Admin';
      case UserRole.user:
        return 'Office Staff';
      case UserRole.guest:
        return 'Worker';
      default:
        return 'Unknown';
    }
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.admin:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case UserRole.user:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.guest:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Self-Promotion Card */}
      {showSelfPromotion && (
        <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Become Master Admin</CardTitle>
                <CardDescription>
                  You need Master Admin privileges to manage users and access all features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
              This appears to be the first time accessing the admin panel. Click the button below to promote yourself to Master Admin and gain full access to all administrative features.
            </p>
            
            {showPromotionPasswordInput && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="promotionPassword">Set Your Password</Label>
                <Input
                  id="promotionPassword"
                  type="password"
                  value={promotionPassword}
                  onChange={(e) => setPromotionPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  minLength={8}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  This password will be used for credential-based login
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handlePromoteToMasterAdmin}
                disabled={promoteToMasterAdminMutation.isPending}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                {promoteToMasterAdminMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Promoting...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    {showPromotionPasswordInput ? 'Confirm Promotion' : 'Promote to Master Admin'}
                  </>
                )}
              </Button>
              {showPromotionPasswordInput && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPromotionPasswordInput(false);
                    setPromotionPassword('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Admin Panel</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Manage user accounts and roles</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      {/* Create User Form */}
      {isAdmin && showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new user account with assigned role</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This password will be used for credential-based login
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="principal">Principal ID</Label>
                <Input
                  id="principal"
                  value={newUserPrincipal}
                  onChange={(e) => setNewUserPrincipal(e.target.value)}
                  placeholder="Enter user's principal ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user's Internet Identity principal ID
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Master Admin</SelectItem>
                    <SelectItem value="office">Office Staff</SelectItem>
                    <SelectItem value="worker">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Accounts ({users?.length || 0})
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12">
                <p className="text-destructive">{error.message || 'Failed to load users'}</p>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Principal ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(([principal, profile]) => (
                      <TableRow key={principal.toString()}>
                        <TableCell className="font-medium">{profile.username}</TableCell>
                        <TableCell>{profile.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                            {getRoleLabel(profile.role)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {principal.toString().slice(0, 20)}...
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser({ principal, name: profile.name, username: profile.username, role: profile.role })}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
