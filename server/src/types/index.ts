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
