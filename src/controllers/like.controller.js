import Like from "../models/like.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"



const toggleEventLike = asyncHandler( async (req, res) =>{
    const {eventId} = req.params
    const existLike = await Like.findOneAndDelete(
        {
            eventId,
            likedBy : req.user._id,
            isLiked : true
        }
    );
    if(existLike){
        await Like.deleteOne({_id: existLike._id});
        return res
            .status(200)
            .json(new ApiResponse(200, existLike, "Event Like removed successfully"));
    }

    const newLike = await Like.create({ eventId, likedBy : req.user._id, isLiked: true});

    return res.status(200).json(new ApiResponse(200, newLike, "Event Liked successfully"))
})


const getAllLikesOnAEvent = asyncHandler(async (req, res) => {
     
    const { eventId } = req.params;
    if (!eventId) {
        throw new ApiError(400, "event id doesn't exist");
    }
    const eventLikeDetails = await Like.find({eventId});
    const likesCount = await Like.countDocuments({ eventId });
   

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { likes: likesCount, eventLikeDetails},
                "Likes for this event retrieved successfully"
            )
        );
});

const getLikedEvents = asyncHandler(async (req, res) => {

    const allLikedEvents = await Like.find({likedBy: req.user._id}).populate("eventId");
    const events = allLikedEvents.map((like) => like.eventId);


    return res
        .status(200)
        .json(new ApiResponse(200, events, "All Liked Events"));
});

export { toggleEventLike, getAllLikesOnAEvent, getLikedEvents };