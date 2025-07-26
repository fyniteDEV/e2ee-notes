import Router from "express";
import dotenv from "dotenv";
import { authenticateAccessToken } from "../middleware/authMiddleware";
import * as noteModel from "../models/note";
import { ProtectedRequest } from "../types";

const notesRouter = Router();
dotenv.config();

notesRouter.get(
    "/",
    authenticateAccessToken,
    async (req: ProtectedRequest, res) => {
        const notes = await noteModel.getNotesByUserId(req.userData!.id);
        res.json({
            success: true,
            message: "Notes fetched successfully",
            notes: notes,
        });
    }
);

export default notesRouter;
