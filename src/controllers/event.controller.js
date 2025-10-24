import { v2 as cloudinary } from "cloudinary";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import crypto from "crypto";

const createEvent = asyncHandler(async (req, res) => {

    let {
        title,
        desc,
        category,
        startDateTime,
        endDateTime,
        location,
        capacity,
        hosts,
        eventType,
        ticketType,
        price,
        requireApproval,
        locationId,
    } = req.body;

    const thumbnail = req.file?.path;
    let tags =  req.body.tags;

    if (!title?.trim() || !desc?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!thumbnail?.trim()) {
        throw new ApiError(400, "Thumbnail is required");
    }
    
    if (typeof tags === "string") {
        tags = tags.split(",").map((tag) => tag.trim());
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        throw new ApiError(400, "At least one tag is required");
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (startDate >= endDate) {
        throw new ApiError(400, "Start date/time must be before end date/time");
    }

    if (startDate < now) {
        throw new ApiError(400, "Start date/time cannot be in the past");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(401, "Unauthorized to create event");
    }

    const thumbnailImg = await uploadOnCloudinary(thumbnail);
    if (!thumbnailImg || !thumbnailImg.url) {
        throw new ApiError(500, "Error uploading image to cloudinary");
    }
    if (ticketType === "paid" && (!price || price < 0)) {
        throw new ApiError(
            400,
            "Price is required for paid events and must be non-negative"
        );
    }
    const eventData = {
        title,
        desc,
        category,
        startDateTime,
        endDateTime,
        location,
        capacity,
        tags,
        hosts: [req.user._id],
        eventType,
        ticketType,
        price,
        requireApproval,
        image: thumbnailImg?.url,
        locationId,
    };

    if (eventType === "private") {
        eventData.token = crypto.randomUUID();
    }

    const newEvent = await Event.create(eventData);
    const hostIds = Array.isArray(hosts) && hosts.length > 0 ? hosts : [req.user._id];

    await User.updateMany(
        { _id: {$in : hostIds} },
        {
            $push: {
                "history.organizedEvent": newEvent?._id,
            },
        }
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newEvent,
                "Event has been created successfully!"
            )
        );
});

const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not Found");
    }

    if (!event.hosts[0].equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to delete");
    }

    await event.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

const updateEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not Found");
    }

    // Only the original creator (first host) can update/delete
    if (!event.hosts[0].equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to update");
    }

    const {
        title,
        desc,
        category,
        startDateTime,
        endDateTime,
        location,
        capacity,
        tags,
        eventType,
        ticketType,
        price,
        requireApproval,
        locationId
    } = req.body;

    if (!title?.trim()) {
        throw new ApiError(400, "Title can't be empty");
    }

    if (!desc?.trim()) {
        throw new ApiError(400, "Desc can't be empty");
    }

    const startDate = startDateTime
        ? new Date(startDateTime)
        : event.startDateTime;
    const endDate = endDateTime ? new Date(endDateTime) : event.endDateTime;

    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (startDate >= endDate) {
        throw new ApiError(400, "Start date/time must be before end date/time");
    }
    if (startDate < now) {
        throw new ApiError(400, "Start date/time cannot be in the past");
    }

    if (!tags || (Array.isArray(tags) && tags.length === 0)) {
        throw new ApiError(400, "At least one tag required");
    }

    if (capacity < 0) {
        throw new ApiError(400, "Can't be negative number");
    }

    if (price < 0) {
        throw new ApiError(400, "Can't be negative number");
    }

    const updateData = {
        ...(title && { title }),
        ...(desc && { desc }),
        ...(category && { category }),
        ...(startDateTime && { startDateTime: startDate }),
        ...(endDateTime && { endDateTime: endDate }),
        ...(location && { location }),
        ...(capacity !== undefined && { capacity }),
        ...(tags && { tags }),
        ...(eventType && { eventType }),
        ...(ticketType && { ticketType }),
        ...(price !== undefined && { price }),
        ...(requireApproval !== undefined && { requireApproval }),
        ...(locationId && {locationId})
    };

    if (eventType === "private" && !event.token) {
        event.token = crypto.randomUUID();
    } else if (eventType === "public" && event.token) {
        event.token = null;
    }

    const updatedEvent = await Event.findOneAndUpdate(
        { _id: eventId, hosts: req.user._id },
        { $set: updateData },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedEvent, "Event Updated successfully!")
        );
});

const allPublicEvent = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sortBy = "startDateTime",
        sortType = "asc",
        category = "all",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1) {
        throw new ApiError(400, "Invalid page or limit values");
    }

    const matchStage = {
        eventType: "public",
        ...(category !== "all" && { category }),
    };

    const publicEvent = await Event.aggregate([
        {
            $match: matchStage,
        },
        {
            $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
        },
        {
            $skip: (pageNum - 1) * limitNum,
        },
        {
            $limit: limitNum,
        },
        {
            $lookup: {
                from: "users",
                localField: "hosts",
                foreignField: "_id",
                as: "hosts",
            },
        },
        {
            $project: {
                title: 1,
                desc: 1,
                category: 1,
                startDateTime: 1,
                endDateTime: 1,
                location: 1,
                capacity: 1,
                tags: 1,
                eventType: 1,
                ticketType: 1,
                price: 1,
                requireApproval: 1,
                image: 1,
                createdAt: 1,
                hosts: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { count: publicEvent?.length, events: publicEvent },
                "All public events retrieved successfully!"
            )
        );
});

const getPrivateEvent = asyncHandler(async (req, res) => {
    const { eventId, token } = req.params;

    if (!eventId || !token) {
        throw new ApiError(400, "Invalid eventId/token");
    }

    const event = await Event.findOne({
        _id: eventId,
        token,
        eventType: "private",
    }).select("-token");

    if (!event) {
        throw new ApiError(404, "Event not found or token invalid");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, event, "Private event fetched successfully!")
        );
});

const findEventById = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId).populate(
        "hosts",
        "name email avatar"
    );

    if (!event) {
        throw new ApiError(404, "Not found!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, event, "event found successfully"));
});




export {
    createEvent,
    deleteEvent,
    updateEvent,
    allPublicEvent,
    getPrivateEvent,
    findEventById,
};
