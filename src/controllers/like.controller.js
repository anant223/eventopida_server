import Like from "../models/like.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"



const toggleEventLike = asyncHandler( async (req, res) =>{
    const {eventId} = req.params
    
    const existLike = await Like.findOne({
        event: eventId,
        likedBy: req.user._id,
    });
    if(existLike){
        await existLike.remove();
        return res
            .status(200)
            .json(new ApiResponse(200, existLike, "Event Like removed successfully"));
    }

    const newLike = await Like.create({ event: eventId, likedBy : req.user._id});

    return res.status(200).json(new ApiResponse(200, newLike, "Event Liked successfully"))
})

const getAllLikesOnAEvent = asyncHandler(async (req, res) =>{
    const {eventId} = req.params
    if(!eventId){
        throw new ApiError(400, "event id doesn't exist")
    }
    const allLikes = await Like.findOne({event : eventId});

    if (!allLikes || allLikes.length === 0) {
        throw new ApiError(404, "No video found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, allLikes, "This is all video liked" ))

})

export {
    toggleEventLike,
    getAllLikesOnAEvent
}