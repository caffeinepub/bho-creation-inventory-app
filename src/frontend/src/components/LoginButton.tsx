import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useCredentialAuth, useCredentialLogout } from '../hooks/useQueries';

export default function LoginButton() {
  const { clear, loginStatus, identity } = useInternetIdentity();
  const credentialAuth = useCredentialAuth();
  const credentialLogout = useCredentialLogout();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity || credentialAuth.isAuthenticated;
  const disabled = loginStatus === 'logging-in';

  const handleLogout = async () => {
    if (credentialAuth.isAuthenticated) {
      credentialLogout();
    } else if (identity) {
      await clear();
      queryClient.clear();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={disabled}
      variant="outline"
      className="rounded-full transition-colors font-medium"
    >
      Logout
    </Button>
  );
}
