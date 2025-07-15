import dotenv from "dotenv";
dotenv.config();
import express from "express";
import * as db from "./db/db";

import authRouter from "./routes/auth";

const app = express();
const port = process.env.port || 3500;

// Middlewares
app.use(express.json());

// Routes
app.use("/auth", authRouter);

app.get("/", (_req, res) => {
    res.json({ message: "Hello world!" });
});

app.listen(port, () => {
    db.testConnection();
    console.log("Server listening on port", port);
});
