import Router, { Response } from "express";
import bcrypt from "bcrypt";
import * as userModel from "../models/user";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ProtectedRequest, RefreshToken, RegisterPayload } from "../types";
import { authenticateAccessToken } from "../middleware/authMiddleware";
import * as refreshTokenModel from "../models/refreshToken";
import crypto from "crypto";

const authRouter = Router();
dotenv.config();

const ACCCESS_TOKEN_SECRET = process.env.ACCCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

function saveRefreshTokenToDB(refreshToken: string, userId: string) {
    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
    const expiresAt = new Date(
        new Date().getTime() + 5 * 24 * 60 * 60 * 1000
    ).toISOString();
    refreshTokenModel.addRefreshToken(userId, refreshTokenHash, expiresAt);
}

function isRegisterPayload(payload: unknown): payload is RegisterPayload {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }

    const obj = payload as Record<string, unknown>;

    return (
        typeof obj.username === "string" &&
        typeof obj.email === "string" &&
        typeof obj.password === "string" &&
        typeof obj.wrappedMasterKey === "string" &&
        typeof obj.kekSalt === "string" &&
        typeof obj.wrapIV === "string" &&
        obj.wrapAlgorithm === "AES-GCM" &&
        typeof obj.kdf === "object" &&
        obj.kdf !== null &&
        (obj.kdf as any).name === "PBKDF2" &&
        (obj.kdf as any).hash === "SHA-256" &&
        typeof (obj.kdf as any).iterations === "number"
    );
}

authRouter.post("/register", async (req, res) => {
    const payload = req.body;

    if (isRegisterPayload(payload)) {
        // check user credentials' validity
        if (
            !emailRegex.test(payload.email) ||
            !usernameRegex.test(payload.username) ||
            !passwordRegex.test(payload.password)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request: Invalid user credential formats",
            });
        }

        console.log(payload);

        const [passwordHash, foundUser] = await Promise.all([
            bcrypt.hash(payload.password, 12),
            userModel.getUserByEmailOrUsername(payload.email, payload.username),
        ]);

        if (foundUser) {
            return res.status(400).json({
                success: false,
                message: "Username or email already taken",
            });
        }

        const newUser = userModel.createUser(
            payload.email,
            payload.username,
            passwordHash,
            payload.wrappedMasterKey,
            payload.kdf.name,
            payload.kdf.hash,
            payload.kdf.iterations,
            payload.wrapAlgorithm,
            payload.kekSalt,
            payload.wrapIV
        );
        if (!newUser) {
            return res
                .status(500)
                .json({ success: false, message: "Internal Server Error" });
        }
        res.json({
            success: true,
            message: "Registration successful",
        });
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid request: Missing or invalid parameters",
        });
    }
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
            logged_in_at: Math.floor(Date.now() / 1000),
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: "5d" }
    );

    saveRefreshTokenToDB(refreshToken, foundUser.id);

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        path: "/auth",
        maxAge: 5 * 24 * 60 * 60 * 1000,
    }).json({
        success: true,
        message: "Login successful",
        accessToken,
        encryption: {
            wrappedMasterKey: foundUser.master_wrapped_pass,
            kdf: {
                name: foundUser.kdf_name,
                hash: foundUser.kdf_hash,
                iterations: foundUser.kdf_iterations,
            },
            kekSalt: foundUser.kek_salt,
            wrapAlgorithm: foundUser.wrap_algorithm,
            wrapIV: foundUser.wrap_iv,
        },
    });
});

authRouter.get("/renew", async (req, res) => {
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

        // check token validity
        const foundUser = await userModel.getUserById(userId!);
        if (!foundUser) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // check session expiration
        const now = Math.floor(Date.now() / 1000);
        const twoWeeks = 14 * 24 * 60 * 60;
        if (loggedInAt + twoWeeks < now) {
            return res.status(403).json({
                success: false,
                message: "Session expired. Please log in again.",
            });
        }

        // revoke refresh token used
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");
        const foundToken = await refreshTokenModel.getEntryByTokenHash(
            refreshTokenHash
        );
        if (foundToken) {
            if (foundToken.revoked) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid refresh token",
                });
            }
            refreshTokenModel.revokeRefreshToken(refreshTokenHash);
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

        saveRefreshTokenToDB(refreshToken, foundUser.id);

        res.cookie("jwt", refreshToken, {
            httpOnly: true,
            path: "/auth",
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

authRouter.post(
    "/logout",
    authenticateAccessToken,
    (req: ProtectedRequest, res: Response) => {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing from cookies",
            });
        }

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");
        refreshTokenModel.revokeRefreshToken(refreshTokenHash);

        res.json({
            success: true,
            message: "User logout successful",
        });
    }
);

export default authRouter;
