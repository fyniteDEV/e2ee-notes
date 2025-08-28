import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface RefreshToken extends JwtPayload {
    sub: string;
    logged_in_at: number;
    iat?: number;
    exp?: number;
}

export interface AccessToken extends JwtPayload {
    id: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}

export interface ProtectedRequest extends Request {
    userData?: {
        id: string;
        email: string;
        username: string;
    };
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
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
    title: string;
    titleIV: string;
    content: string;
    contentIV: string;
    noteKey: {
        wrappedNoteKey: string;
        noteKeyIV: string;
    };
}
