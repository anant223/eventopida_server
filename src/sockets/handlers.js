import { getAllLikesOnAEvent, toggleEventLike } from "../controllers/like.controller.js";
import ApiError from "../utils/ApiError.js";
export function setupSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("new User", socket.id);

        socket.on("toggleEventLike", async (data) => {
            try {
                console.log(data);
                const result = await toggleEventLike(data);
                // Emit a response back to the client
                socket.emit("toggleEventLikeResponse", {
                    success: true,
                    result,
                });
            } catch (error) {
                // Emit error back to the client
                socket.emit("toggleEventLikeResponse", {
                    success: false,
                    error: "Something went wrong",
                });
            }
        });

        socket.on("totalLikes", async (data) => {
            try {
                const likes = await getAllLikesOnAEvent(data);
                // Emit the likes back to the client
                socket.emit("totalLikesResponse", { success: true, likes });
            } catch (error) {
                // Emit error back to the client
                socket.emit("totalLikesResponse", {
                    success: false,
                    error: "Something went wrong while fetch like data",
                });
            }
        });

        socket.on("disconnect", () => {
            console.log("User lost connection ", socket.id);
        });
    });
}

