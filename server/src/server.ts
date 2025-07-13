import express from "express";

const server = express();

server.get("/", (_req, res) => {
    res.json({ message: "Hello world!" });
});

server.listen(3000, () => {
    console.log("app listening on port 3000");
});
