import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const ACCCESS_TOKEN_SECRET = process.env.ACCCESS_TOKEN_SECRET!;

export const authenticateAccessToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token missing",
        });
    }

    try {
        const decoded = jwt.verify(token!, ACCCESS_TOKEN_SECRET);
        console.log(decoded);
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid access token",
        });
    }

    next();
};
