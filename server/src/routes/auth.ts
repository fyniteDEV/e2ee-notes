import Router from "express";
import bcrypt from "bcrypt";
import * as userModel from "../models/user";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({
            success: false,
            message: "Invalid request: missing parameters",
        });
    }

    const [passwordHash, foundUser] = await Promise.all([
        bcrypt.hash(req.body.password, 12),
        userModel.findUserByEmailOrUsername(req.body.email, req.body.username),
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

authRouter.post("/login", (req, res) => {
    res.sendStatus(500);
});

authRouter.get("/renew", (req, res) => {
    res.sendStatus(500);
});

export default authRouter;
