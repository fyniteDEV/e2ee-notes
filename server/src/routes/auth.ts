import Router from "express";
import bcrypt from "bcrypt";
import * as userModel from "../models/user";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { RefreshToken } from "../types";

const authRouter = Router();
dotenv.config();

const ACCCESS_TOKEN_SECRET = process.env.ACCCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

authRouter.post("/register", async (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: Missing parameters",
        });
    } else if (
        !emailRegex.test(req.body.email) ||
        !usernameRegex.test(req.body.username) ||
        !passwordRegex.test(req.body.password)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: Invalid parameter formats",
        });
    }

    const [passwordHash, foundUser] = await Promise.all([
        bcrypt.hash(req.body.password, 12),
        userModel.getUserByEmailOrUsername(req.body.email, req.body.username),
    ]);

    if (foundUser) {
        return res.status(400).json({
            success: false,
            message: "Username or email already taken",
        });
    }

    const newUser = userModel.createUser(
        req.body.email,
        req.body.username,
        passwordHash
    );
    if (!newUser) {
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
    res.json({
        success: true,
        message: "Registration successful",
    });
});

authRouter.post("/login", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: missing parameters",
        });
    }

    const foundUser = await userModel.getUserByEmail(req.body.email);
    if (!foundUser) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid email or password" });
    }

    const pwMatch = await bcrypt.compare(
        req.body.password,
        foundUser.password_hash
    );
    if (!pwMatch) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
        {
            id: foundUser.id,
            email: foundUser.email,
            username: foundUser.username,
        },
        ACCCESS_TOKEN_SECRET,
        { expiresIn: "5m" }
    );
    const refreshToken = jwt.sign(
        {
            sub: foundUser.id,
            logged_in_at: Date.now(),
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: "5d" }
    );

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        path: "/auth/renew",
        maxAge: 5 * 24 * 60 * 60 * 1000,
    }).json({ success: true, message: "Login successful", accessToken });
});

authRouter.get("/renew", async (req, res) => {
    console.log(req.cookies);
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Refresh token missing from cookies",
        });
    }

    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshToken;
        const userId = decoded.sub.toString();
        const loggedInAt = decoded.logged_in_at;

        const foundUser = await userModel.getUserById(userId!);
        if (!foundUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const now = Date.now();
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        if (loggedInAt + twoWeeks < now) {
            console.log(now, twoWeeks, loggedInAt);
            return res.status(403).json({
                success: false,
                message: "Session expired. Please log in again.",
            });
        }

        const accessToken = jwt.sign(
            {
                id: foundUser.id,
                email: foundUser.email,
                username: foundUser.username,
            },
            ACCCESS_TOKEN_SECRET!,
            { expiresIn: "5m" }
        );
        const refreshToken = jwt.sign(
            {
                sub: foundUser.id,
                logged_in_at: loggedInAt,
            },
            REFRESH_TOKEN_SECRET!,
            { expiresIn: "5d" }
        );

        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            path: "/auth/renew",
            maxAge: 5 * 24 * 60 * 60 * 1000,
        }).json({
            success: true,
            message: "Token renewal successful",
            accessToken,
        });
    } catch (err) {
        console.error(err);
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
});

export default authRouter;
