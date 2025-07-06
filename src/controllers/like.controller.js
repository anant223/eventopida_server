import Like from "../models/like.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import mongoose from "mongoose"


const getEventLikes = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const likes = await Like.find({
        eventId: new mongoose.Types.ObjectId(eventId),
    })
        .populate("likedBy", "name email")
        .sort({ createdAt: -1 })
        .select("eventId likedBy createdAt");
    const likesCount = likes.length;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                likes,
                likesCount,
            },
            "Likes for this event retrieved successfully"
        )
    );
});

// Get list of users who liked (for "liked by John, Mary..." feature)
const getEventLikedUsers = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Not valid event id");
    }

    const result = await Like.aggregate([
        {
            $match: { eventId: new mongoose.Types.ObjectId(eventId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        {
            $unwind: "$userInfo",
        },
        {
            $project: {
                _id: 1,
                eventId: 1,
                likedBy: 1,
                createdAt: 1,
                userInfo: 1,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { users: result },

            "Users who liked this event retrieved successfully"
        )
    );
});

// get all events that like by a user
const getUserLikedEvents = asyncHandler(async (req, res) => {
    if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
        throw new ApiError(400, "Not autherized");
    }

    const result = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "events",
                localField: "eventId",
                foreignField: "_id",
                as: "eventInfo",
            },
        },
        {
            $unwind: "$eventInfo",
        },
        {
            $facet: {
                documents: [
                    {
                        $project: {
                            _id: 1,
                            eventId: 1,
                            likedBy: 1,
                            createdAt: 1,
                            eventInfo: 1,
                        },
                    },
                ],
                totalCount: [
                    {
                        $count: "totalLikedEvents",
                    },
                ],
            },
        },
    ]);

    const documents = result[0].documents || [];
    const totalCount = result[0].totalCount[0]?.totalLikedEvents || 0;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { likedEvents: documents, totalCount },
                "Liked events retrieved successfully"
            )
        );
});

export {getEventLikedUsers, getEventLikes, getUserLikedEvents};