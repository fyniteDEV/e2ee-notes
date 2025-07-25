import Router from "express";
import dotenv from "dotenv";
import { authenticateAccessToken } from "../middleware/authMiddleware";

const notesRouter = Router();
dotenv.config();

notesRouter.get("/", authenticateAccessToken, (req, res) => {
    res.json({ message: "hello world" });
});

export default notesRouter;
