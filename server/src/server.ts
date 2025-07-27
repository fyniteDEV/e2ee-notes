import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import * as db from "./db/db";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import notesRouter from "./routes/notes";

const app = express();
const port = process.env.PORT || 3500;

// ERROR HANDLING
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", reason);
});
process.on("SIGINT", () => {
    console.log("Received SIGINT, shutting down.");
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down.");
    process.exit(0);
});

// Middlewares
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    })
);
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/api/notes", notesRouter);
app.get("/", (_req, res) => {
    res.json({ message: "Hello world!" });
});

app.listen(port, () => {
    db.testConnection();
    console.log("Server listening on port", port);
});
