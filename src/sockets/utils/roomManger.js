export class RoomManager {
    constructor(io) {
        this.io = io;
        this.roomStats = new Map();
        this.userRooms = new Map();
    }

    joinRoom(socket, roomId, metadata = {}) {
        try {
            socket.join(eventId);
            if (!this.userRooms.has(roomId)) {
                this.userRooms.set(roomId, new Set());
            }
            this.userRooms.get(roomId).add(socket.id);
            socket.to(roomId).emit("join_room", {
                userId: socket.id,
                roomId,
                data: metadata,
            });
        } catch (error) {
            console.log(error.message);
            return;
        }
    }
    leaveRoom(socket, roomId) {
        try {
            socket.leave(roomId);
            if (this.roomStats.has(roomId)) {
                this.roomStats.get(roomId).delete(socket.id);
            }
        } catch (error) {
            console.log(error.message);
            return;
        }
    }
}

let RoomManagerInstance = null;

export const initRoomManager = (io) => {
    RoomManagerInstance = new RoomManager(io);
};
  

export const getRoomManger = () => RoomManagerInstance