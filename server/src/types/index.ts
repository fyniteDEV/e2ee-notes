import { JwtPayload } from "jsonwebtoken";

export interface RefreshToken extends JwtPayload {
    sub: string;
    logged_in_at: number;
    iat: number;
    exp: number;
}

export interface AccessToken extends JwtPayload {
    id: string;
    email: string;
    username: string;
    iat: number;
    exp: number;
}
