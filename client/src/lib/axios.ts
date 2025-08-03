import axios from "axios";

const baseApi = axios.create({
    baseURL: import.meta.env.VITE_SRV_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const api = Object.assign(baseApi, {
    protected: {
        get: (url: string, accessToken: string) => {
            return baseApi.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        },
        delete: (url: string, accessToken: string) => {
            return baseApi.delete(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        },
        post: (url: string, body: {}, accessToken: string) => {
            return baseApi.post(url, body, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        },
        put: (url: string, body: {}, accessToken: string) => {
            return baseApi.put(url, body, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        },
    },
});
