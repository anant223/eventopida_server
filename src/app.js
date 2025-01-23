import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
);


app.use(express.json({limit:"24kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import eventRouter from "./routes/event.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);


export default app;
