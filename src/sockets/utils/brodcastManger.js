class BroadcastManger {
    constructor(io, roomManger){
        this.io = io;
        this.roomManger = roomManger;
        this.messageQueue = new Map();
        this.deliveryTracking = new Map();
        this.broadcastStats = {
            totalBroadcasts : 0,
            totalRecipients : 0,
            failedBroadcasts : 0
        }
    }

    toRoom(roomId, event, data, options={}){
        try {
            // need message
            const message = this.createMessage(event, data, {roomId, ...options});
            // particepent size
            const recipientCount  = this.roomManger.getRoomSize(roomId);

            // air check if no participent
            if(recipientCount === 0 && !options.allowEmpty){
                console.log(`Broadcasting to empty room : ${roomId}`);
                return {sucess: false, reason: "empty_room"};
            }

            if(options.excludeUser){
                this.io.to(roomId).except(options.excludeUser).emit(event, message)
            }else {
                this.io.to(roomId).emit(event, message);
            }

            this.trackBroadcast(roomId, recipientCount, message.id);

            return {
                sucess: true,
                messageId: message.id,
                recipients: recipientCount
            }
        } catch (error) {
            this.broadcastStats.failedBroadcasts ++

            console.log("Broadcast failed: ", error);

            return {sucess: false, error: error.message}
        }
    }

    toRooms(roomIds, event, data, options={}){
        const results = []
        let totalRecipients = 0;

        roomIds.foreach(roodId => {
            const result =  this.toRoom(roodId, event, data, options)

            result.push({roodId, ...result})

            if(result.sucess){
                totalRecipients += result.recipients
            }
        })

        return {
            sucess: results.some(r => r.su)
        }
    }

    
}