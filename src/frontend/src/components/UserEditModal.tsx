import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateUserRole } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { UserRole } from '../backend';

interface UserEditModalProps {
  user: {
    principal: Principal;
    name: string;
    username: string;
    role: UserRole;
  };
  onClose: () => void;
}

export default function UserEditModal({ user, onClose }: UserEditModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    switch (user.role) {
      case UserRole.admin:
        return 'admin';
      case UserRole.user:
        return 'office';
      case UserRole.guest:
        return 'worker';
      default:
        return 'worker';
    }
  });

  const updateRoleMutation = useUpdateUserRole();

  const handleSave = async () => {
    try {
      await updateRoleMutation.mutateAsync({
        userPrincipal: user.principal,
        role: selectedRole,
      });
      toast.success('User role updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Master Admin';
      case 'office':
        return 'Office Staff';
      case 'worker':
        return 'Worker';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update role for {user.name} (@{user.username})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {user.name}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              @{user.username}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Principal ID</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-xs font-mono break-all">
              {user.principal.toString()}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Master Admin</SelectItem>
                <SelectItem value="office">Office Staff</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current role: {getRoleLabel(selectedRole)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateRoleMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRoleMutation.isPending}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          >
            {updateRoleMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
