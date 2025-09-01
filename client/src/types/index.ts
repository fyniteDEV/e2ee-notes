export interface Note {
    id: number | undefined;
    title: string;
    content: string;
    createdAt: string | undefined;
}

export interface EncryptedNote extends Note {
    titleIV: string;
    contentIV: string;
    wrappedNoteKey: string;
    noteKeyIV: string;
}

export interface NotePreview {
    id: number;
    title: string;
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

export interface NotePayload {
    id: number | undefined;
    title: string;
    titleIV: string;
    content: string;
    contentIV: string;
    noteKey: {
        wrappedNoteKey: string;
        noteKeyIV: string;
    };
}
