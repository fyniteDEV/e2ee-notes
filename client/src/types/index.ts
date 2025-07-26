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
