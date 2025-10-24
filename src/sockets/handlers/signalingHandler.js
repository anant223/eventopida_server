import { getRoomManger } from "../utils/roomManger";

export const joinRoom = (socket) => {
    socket.on("join_room", (data) => {
        const {eventId, userId} = data;
        getRoomManger().joinRoom(socket, `${eventId}`, {
            userId: socket?.user?._id,
            joinedAt: new Date(),
            joinReason: "live_intreaction",
        });
    });
};

export const userOffer = (socket) => {
    socket.on("offer", (data) => {
        const {eventId, userid} = data;
        socket.to(eventId).emit(`from offer ${socket.id} - ${eventId}`)
    });
};

export const userAnswer = (socket) => {
    socket.on("answer", (data) => {

    });
};