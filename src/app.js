import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http"
import { Server } from "socket.io";


const app = express();
const server = http.createServer(app);

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
import likeRouter from "./routes/like.routes.js";
import registerRouter from "./routes/register.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/register", registerRouter);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});


io.on("connection", (socket)=>{
    console.log("User Connected ", socket.id);
    
    socket.on("disconnect", () =>{
        console.log("User lost connection ", socket.id);
    })
})




export { app, server, io };