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
export interface FabricInventoryEntry {
    fabricName: string;
    purchaseDate?: bigint;
    billPhoto?: ExternalBlob;
    fabricPhoto?: ExternalBlob;
    quantity: number;
    rackId: string;
}
export interface AuditLogEntry {
    action: string;
    fabricName: string;
    userId: string;
    timestamp: bigint;
    quantity: number;
    rackId: string;
}
export interface UserProfile {
    username: string;
    name: string;
    role: UserRole;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFabricEntry(rackId: string, fabric: {
        fabricName: string;
        purchaseDate?: bigint;
        billPhoto?: ExternalBlob;
        fabricPhoto?: ExternalBlob;
        quantity: number;
    }): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(userPrincipal: Principal, role: string): Promise<string>;
    createUser(userPrincipal: Principal, name: string, username: string, role: string): Promise<string>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAuditLog(): Promise<Array<AuditLogEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInventory(): Promise<Array<[string, FabricInventoryEntry]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeFabricEntry(rackId: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateFabricQuantity(rackId: string, usedQuantity: number): Promise<string>;
}
