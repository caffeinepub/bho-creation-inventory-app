import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, FabricEntry, ExternalBlob, UpdateFabricData } from '../backend';
import { Principal } from '@dfinity/principal';

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetInventory() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, FabricEntry]>>({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventory();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useAddFabricEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fabricName,
      rackId,
      quantity,
      itemType,
      unit,
      fabricPhoto,
      purchaseDate,
      billPhoto,
    }: {
      fabricName: string;
      rackId: string;
      quantity: number;
      itemType: string;
      unit: string;
      fabricPhoto?: ExternalBlob;
      purchaseDate?: bigint;
      billPhoto?: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFabricEntry(rackId, {
        itemType,
        fabricName,
        quantity,
        unit,
        fabricPhoto,
        purchaseDate,
        billPhoto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateFabricEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      oldRackId,
      updatedData,
    }: {
      oldRackId: string;
      updatedData: UpdateFabricData;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFabricEntry(oldRackId, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAdjustQuantity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rackId,
      quantityChange,
    }: {
      rackId: string;
      quantityChange: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adjustQuantity(rackId, quantityChange);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateFabricQuantity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rackId, usedQuantity }: { rackId: string; usedQuantity: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFabricQuantity(rackId, usedQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// User Management Hooks
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userPrincipal,
      name,
      username,
      password,
      role,
    }: {
      userPrincipal: Principal;
      name: string;
      username: string;
      password: string;
      role: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUser(userPrincipal, name, username, password, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userPrincipal,
      role,
    }: {
      userPrincipal: Principal;
      role: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignUserRole(userPrincipal, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function usePromoteToMasterAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      name,
      password,
    }: {
      username: string;
      name: string;
      password: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.promoteToMasterAdmin({ username, name, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// Username/Password Login Hook
export function useLoginWithCredentials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      const result = await actor.loginWithCredentials(username, password);
      
      if (result.__kind__ === 'error') {
        throw new Error(result.error);
      }
      
      // Store the authenticated user profile in a way that the app can recognize
      // We'll use a special query key to store credential-based auth state
      queryClient.setQueryData(['credentialAuth'], {
        isAuthenticated: true,
        profile: result.success,
      });
      
      return result.success;
    },
    onSuccess: (profile) => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Hook to check credential-based authentication state
export function useCredentialAuth() {
  const queryClient = useQueryClient();
  const authData = queryClient.getQueryData<{
    isAuthenticated: boolean;
    profile: UserProfile;
  }>(['credentialAuth']);
  
  return {
    isAuthenticated: authData?.isAuthenticated ?? false,
    profile: authData?.profile ?? null,
  };
}

// Hook to logout from credential-based auth
export function useCredentialLogout() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.setQueryData(['credentialAuth'], null);
    queryClient.clear();
  };
}
