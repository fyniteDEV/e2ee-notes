export interface Note {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

export interface EncryptedNote {
    id: number;
    title: string;
    title_iv: string;
    content: string;
    content_iv: string;
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
