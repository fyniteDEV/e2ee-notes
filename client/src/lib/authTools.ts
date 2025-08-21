import { api } from "./axios";
import { type AuthContextType } from "../context/AuthProvider";

export const accessTokenIsExpired = (accessToken: string) => {
    const payloadEncoded = accessToken.split(".")[1];
    const payload = JSON.parse(atob(payloadEncoded));
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();

    // treat as expired even if it will expire in the next 5 seconds
    const bufferMilliseconds = 5000;

    return expirationDate.getTime() - now.getTime() <= bufferMilliseconds;
};

export const handleTokenRenew = async (auth: AuthContextType) => {
    try {
        const res = await api.get("/auth/renew");
        if (res.data.success) {
            auth.setAccessToken(res.data.accessToken);
        } else {
            console.error(res.data.message);
            throw new Error(res.data.message);
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};
