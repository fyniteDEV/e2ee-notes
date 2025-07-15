import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

if (!process.env.PG_URI) {
    throw new Error("missing PG_URI in .env");
}

export const pool = new Pool({
    connectionString: process.env.PG_URI,
});

export const testConnection = () => {
    pool.query("SELECT 1")
        .then(() => {
            console.log("connection to database successful");
        })
        .catch((err) => {
            console.error("failed to connect to database:", err);
            process.exit(1);
        });
};
