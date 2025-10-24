import mongoose from "mongoose";
import Like from "../../models/like.model.js";
import {getRoomManger} from "../utils/roomManger.js";
import { io } from "../../app.js";

// toggle like service
const toggleLikeService = async (eventId, userId) => {
    
    const like = await Like.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        likedBy: new mongoose.Types.ObjectId(userId),
    });

    if (like) {
        await Like.deleteOne({ _id: like._id });
        const totalLikes = await Like.countDocuments({
            eventId: new mongoose.Types.ObjectId(eventId),
        });
        return {totalLikes, eventId };
    } else {
        const newLike = await Like.create({
            eventId: new mongoose.Types.ObjectId(eventId),
            likedBy: new mongoose.Types.ObjectId(userId),
        }).populate("likedBy", "email, name").select("eventId likedBy createdAt");
        const totalLikes = await Like.countDocuments({
            eventId: new mongoose.Types.ObjectId(eventId),
        });
        return {newLike, totalLikes };
    }
    
}

export const joinRoom = async(socket) => {
    socket.on("join_room", async(data) => {
        const { eventId } = data;
        // Join room with useful metadata
        getRoomManger().joinRoom(socket, `event:${eventId}`, {
            userId: socket?.user?._id,
            joinedAt: new Date(),
            joinReason: "like_interaction",
        });
    })
}

// Like/unlike an event
export const handleLike = async (socket) => {
    socket.on("toggle_like", async(data) => {
        try {
            const { eventId } = data;
            const userId = socket.user._id;
            console.log("userId : ", userId);
            console.log("eventId : ", eventId);


            // Validate both inputs
            if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
                socket.emit("error", {
                    message: "Invalid event ID",
                    type: "VALIDATION_ERROR",
                });
                return;
            }

            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                socket.emit("error", {
                    message: "User not authenticated",
                    type: "AUTH_ERROR",
                });
                return;
            }
            const result = await toggleLikeService(eventId, userId);

            io.to(room).emit("like_update", result);
              
        } catch (error) {
            console.error("Toggle like failed:", error);

        }
    })
}
