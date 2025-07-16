import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_SRV_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export type ApiError = {
    success: boolean;
    message: string;
    accessToken?: string;
};
