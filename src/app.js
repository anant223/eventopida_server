import express from "express";
import {createServer} from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { initializeSocketIO } from "./sockets/index.js";
import { initRoomManager } from "./sockets/utils/roomManger.js";
const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URI,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
initRoomManager(io);


app.use(compression());

initializeSocketIO();



app.use(
    cors({
        origin: process.env.CLIENT_URI,
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




export { app, server, io};