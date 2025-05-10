import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: "https://eventopida.netlify.app/",
        credentials: true,
    })
);

app.use(express.json({limit:"24kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import eventRouter from "./routes/event.routes.js";
import likeRouter from "./routes/like.routes.js";
import registerRouter from "./routes/register.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/register", registerRouter);









export { app};