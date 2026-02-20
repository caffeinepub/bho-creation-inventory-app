import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile, usePromoteToMasterAdmin } from '../hooks/useQueries';
import { UserRole } from '../backend';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  
  const saveProfile = useSaveCallerUserProfile();
  const promoteToMasterAdmin = usePromoteToMasterAdmin();
  const { data: userProfile, isFetched } = useGetCallerUserProfile();

  const isLoading = saveProfile.isPending || promoteToMasterAdmin.isPending;

  // Only show modal if profile is null and data is fetched
  const isOpen = isFetched && userProfile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !username.trim()) {
      return;
    }

    try {
      if (isMasterAdmin) {
        if (!password.trim()) {
          return;
        }
        await promoteToMasterAdmin.mutateAsync({ name, username, password });
      } else {
        await saveProfile.mutateAsync({
          name,
          username,
          role: UserRole.user,
        });
      }
    } catch (error) {
      console.error('Profile setup error:', error);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>
            Please provide your information to get started.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="masterAdmin"
                checked={isMasterAdmin}
                onChange={(e) => setIsMasterAdmin(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="masterAdmin" className="cursor-pointer">
                I am the Master Admin (first user)
              </Label>
            </div>
          </div>

          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set your password (min 8 characters)"
                disabled={isLoading}
                required={isMasterAdmin}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                As Master Admin, you'll need a password for credential-based login
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !name.trim() || !username.trim() || (isMasterAdmin && !password.trim())}
          >
            {isLoading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
