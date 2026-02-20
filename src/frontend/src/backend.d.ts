import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface FabricEntry {
    fabricName: string;
    purchaseDate?: bigint;
    billPhoto?: ExternalBlob;
    unit: string;
    fabricPhoto?: ExternalBlob;
    itemType: string;
    quantity: number;
}
export interface AuditLogEntry {
    action: string;
    fabricName: string;
    userId: string;
    timestamp: bigint;
    quantity: number;
    rackId: string;
}
export type LoginResult = {
    __kind__: "error";
    error: string;
} | {
    __kind__: "success";
    success: UserProfile;
};
export interface UserProfile {
    username: string;
    name: string;
    role: UserRole;
}
export interface UpdateFabricData {
    fabricName: string;
    purchaseDate?: bigint;
    billPhoto?: ExternalBlob;
    unit: string;
    fabricPhoto?: ExternalBlob;
    itemType: string;
    quantity: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFabricEntry(rackId: string, entryData: {
        fabricName: string;
        purchaseDate?: bigint;
        billPhoto?: ExternalBlob;
        unit: string;
        fabricPhoto?: ExternalBlob;
        itemType: string;
        quantity: number;
    }): Promise<string>;
    adjustQuantity(rackId: string, quantityChange: number): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(userPrincipal: Principal, role: string): Promise<string>;
    createUser(userPrincipal: Principal, name: string, username: string, password: string, role: string): Promise<string>;
    getAllInventoryFabricEntries(): Promise<Array<[string, FabricEntry]>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAuditLog(): Promise<Array<AuditLogEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInventory(): Promise<Array<[string, FabricEntry]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginWithCredentials(username: string, password: string): Promise<LoginResult>;
    promoteToMasterAdmin(masterAdminMetadata: {
        username: string;
        password: string;
        name: string;
    }): Promise<string>;
    removeFabricEntry(rackId: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateFabricEntry(rackId: string, updatedData: UpdateFabricData): Promise<string>;
    updateFabricQuantity(rackId: string, usedQuantity: number): Promise<string>;
}
