import Router from "express";
import bcrypt from "bcrypt";
import * as userModel from "../models/user";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const authRouter = Router();
dotenv.config();

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
        process.env.ACCCESS_TOKEN_SECRET!,
        { expiresIn: "5m" }
    );
    const refreshToken = jwt.sign(
        {
            id: foundUser.id,
        },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "5d" }
    );

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        path: "/auth/refresh",
        maxAge: 5 * 24 * 60 * 60 * 1000,
    }).json({ success: true, message: "Login successful", accessToken });
});

authRouter.get("/renew", (req, res) => {
    res.sendStatus(500);
});

export default authRouter;
