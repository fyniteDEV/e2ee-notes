import Router from "express";

const authRouter = Router();

authRouter.post("/register", (req, res) => {
    res.sendStatus(500);
});

authRouter.post("/login", (req, res) => {
    res.sendStatus(500);
});

authRouter.get("/renew", (req, res) => {
    res.sendStatus(500);
});

export default authRouter;
