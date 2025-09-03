import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import * as db from "./db/db";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import notesRouter from "./routes/notes";

const app = express();
const port = process.env.PORT || 3500;
dotenv.config();

// Error handling and graceful shutdown
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    closeServer();
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", reason);
    closeServer();
});
process.on("SIGINT", () => {
    console.log("Received SIGINT, shutting down.");
    closeServer();
});
process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down.");
    closeServer();
});
process.on("SIGTSTP", () => {
    console.log("Received SIGTSTP, pausing. Use 'fg' to resume.");
});

// Middlewares
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "DELETE", "PUT"],
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

const server = app.listen(port, () => {
    db.testConnection();
    console.log("Server listening on port", port);
});

const closeServer = () => {
    server.close(() => {
        console.log("Server closes on port", port);
    });
};
