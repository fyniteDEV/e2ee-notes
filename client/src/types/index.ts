export interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export type ApiResponse = {
    success: boolean;
    message: string;
    accessToken?: string;
    notes?: Note[];
};

export interface WrappedMasterKey {
    wrapped: ArrayBuffer;
    iv: Uint8Array<ArrayBuffer>;
}

export interface LoginSrvResponse {
    success: boolean;
    message: string;
    accessToken?: string;
    encryption?: EncryptionDataBase64;
}

export interface EncryptionDataBase64 {
    wrappedMasterKey: string;
    kekSalt: string;
    kdf: {
        name: "PBKDF2";
        hash: "SHA-256";
        iterations: number;
    };
    wrapAlgorithm: "AES_GCM";
    wrapIV: string;
}
