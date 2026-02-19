import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, FabricInventoryEntry, ExternalBlob } from '../backend';
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

  return useQuery<Array<[string, FabricInventoryEntry]>>({
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
      fabricPhoto,
      purchaseDate,
      billPhoto,
    }: {
      fabricName: string;
      rackId: string;
      quantity: number;
      fabricPhoto?: ExternalBlob;
      purchaseDate?: bigint;
      billPhoto?: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFabricEntry(rackId, {
        fabricName,
        quantity,
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
      role,
    }: {
      userPrincipal: Principal;
      name: string;
      username: string;
      role: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUser(userPrincipal, name, username, role);
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
    }: {
      username: string;
      name: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.promoteToMasterAdmin({ username, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}
