import { handleLike, joinRoom } from "../sockets/handler/likeHandlers.js";
import { io } from "../app.js";
import { authenticateSocket } from "../sockets/middlewares/socket.auth.middleware.js";
import { checkRateLimit, stopCleanup } from "../sockets/middlewares/socket.rateLimit.middleware.js";
import {RoomManager} from "./utils/roomManger.js";
export const initializeSocketIO = () => {

    // middleware
    io.use(authenticateSocket); 

    // Connection handler
    io.on("connection", (socket) => {
        console.log(
            `User connected: ${socket.user?.username} (${socket.userId})`
        );
        joinRoom(socket);
        // Handlers
        handleLike(socket);

        // Handle disconnection and cleanup
        socket.on("disconnect", () => {
            console.log(
                `User disconnected: ${socket.user?.username}`
            );
        });

        // Optional: Handle connection errors
        socket.on("error", (error) => {
            console.error(`Socket error for user ${socket.userId}:`, error);
        });
    });

    const gracefulShutdown = () => {
        console.log("Shutting down socket.IO server...");

        //Stop rate limiter cleanup
        stopCleanup();

        //Close socket connections

        io.close(() => {
            console.log("Socket.IO server closed");
        });
    };
    
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    console.log("Socket.IO initialized successfully");
};


