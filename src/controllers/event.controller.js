import { v2 as cloudinary } from "cloudinary";
import asyncHandler from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { 
    sendCoHostsNotification, 
    sendInvitedUserNotification, 
    sendPublicEventNotification } 
from "../sockets/utils/notifications.js";
import {safeNotify} from "../utils/index.js"
import {io} from "../app.js"


const createEvent = asyncHandler(async (req, res) => {
    let {
        title,
        desc,
        category,
        startDateTime,
        endDateTime,
        location,
        capacity,
        eventType,
        ticketType,
        price,
        requireApproval,
        locationId,
    } = req.body;

    const thumbnail = req.file?.path;
    let tags = req.body.tags;

    if (!title?.trim() || !desc?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!thumbnail?.trim()) {
        throw new ApiError(400, "Thumbnail is required");
    }

    if (typeof tags === "string") {
        tags = tags.split(",").map((tag) => tag.trim());
    }

    if (!Array.isArray(tags) || tags.length === 0) {
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

    if (ticketType === "paid") {
        if (!user.stripeOnboardingCompleted) {
            throw new ApiError(
                403,
                "Complete Stripe onboarding before creating a paid event"
            );
        }

        if (price == null || price <= 0) {
            throw new ApiError(
                400,
                "Price is required for paid events and must be greater than zero"
            );
        }
    }

    const thumbnailImg = await uploadOnCloudinary(thumbnail);
    if (!thumbnailImg?.url) {
        throw new ApiError(500, "Error uploading image to Cloudinary");
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
        organizerId: req.user._id,
        eventType,
        ticketType,
        price: ticketType === "paid" ? price : 0,
        requireApproval,
        image: thumbnailImg.url,
        locationId,
        status: "draft",
    };

    if (eventType === "private") {
        eventData.token = crypto.randomUUID();
    }

    const newEvent = await Event.create(eventData);

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


const coHosts = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { hosts, message } = req.body;
    const creator = req.user;

    if (!Array.isArray(hosts) || hosts.length === 0) {
        throw new ApiError(400, "hosts array is required");
    }

    const event = await Event.findOne({
        _id: eventId,
        organizerId: creator._id,
    });

    if (!event) {
        throw new ApiError(404, "Event not found or not authorized");
    }

    if (event.status !== "draft") {
        throw new ApiError(403, "Co-hosts can't be added after publishing");
    }

    const verifiedHosts = await User.find({
        _id: { $in: hosts },
    }).select("_id");

    if (verifiedHosts.length !== hosts.length) {
        throw new ApiError(400, "Some host IDs are invalid");
    }

    const existingHosts = new Set(event.hosts.map((host) => host.userId.toString()));

    const newHosts = hosts.filter((id) => {
        const idStr = id.toString();
        return (
            idStr !== event.organizerId.toString() && !existingHosts.has(idStr)
        );
    });

    if (newHosts.length === 0) {
        throw new ApiError(409, "All users are already co-hosts");
    }

    event.hosts.push(...newHosts.map((id) => ({ userId: id })));

    await event.save();

    safeNotify(
        () =>
        sendCoHostsNotification(io, { event, creator, newHosts, message }),
        "sendCoHostsNotification"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { addedHosts: newHosts.length },
                "Co-hosts added successfully"
            )
        );
});

const privateUserInvitations = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { invitedUsers, message } = req.body;
    const inviter = req.user._id;

    if (!Array.isArray(invitedUsers) || invitedUsers.length === 0) {
        throw new ApiError(400, "invitedUsers array is required");
    }

    const event = await Event.findOne({
        _id: eventId,
        $or: [{ organizerId: inviter }, { "hosts.userId": inviter }],
    });

    if (!event) {
        throw new ApiError(403, "Event not found or not authorized");
    }

    if (new Date(event.startDate).getTime() <= Date.now()) {
        throw new ApiError(403, "Users can't be invited after event start");
    }

    const verifiedUsers = await User.find({
        _id: { $in: invitedUsers },
    }).select("_id");

    if (verifiedUsers.length !== invitedUsers.length) {
        throw new ApiError(404, "Some users not found");
    }

    const alreadyInvited = new Set(
        event.invitedUsers.map((u) => u.userId.toString())
    );

    const hostIds = new Set(event.hosts.map((h) => h.userId.toString()));

    const newInvitedUsers = invitedUsers.filter((id) => {
        const idStr = id.toString();
        return (
            idStr !== event.organizerId.toString() &&
            !alreadyInvited.has(idStr) &&
            !hostIds.has(idStr)
        );
    });

    if (newInvitedUsers.length === 0) {
        throw new ApiError(409, "All users are already invited");
    }

    event.invitedUsers.push(...newInvitedUsers.map((id) => ({ userId: id })));

    await event.save();

    safeNotify(
        () => sendInvitedUserNotification(io, { event, inviter, message }),
        "sendInvitedUserNotification"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { invitedCount: newInvitedUsers.length },
                "Users invited successfully"
            )
        );
});

const activeEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await Event.findOne({
        _id: eventId,
        organizerId: req.user._id,
    });

    if (!event) {
        throw new ApiError(404, "Event not found or not authorized");
    }

    if (event.status !== "draft") {
        throw new ApiError(400, "Only draft events can be activated");
    }

    event.status = "active";
    await event.save();

    safeNotify(
        () => sendPublicEventNotification(io, event, req.user),
        "sendPublicEventNotification"
    );
    return res
        .status(202)
        .json(new ApiResponse(202, event, "Event is now live"));
});

const acceptOrDeclineInvitation = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

    const event = await Event.findOne({
        _id: eventId,
        "invitedUsers.userId": userId,
    });

    if (!event) {
        throw new ApiError(404, "Invitation not found");
    }

    const invitation = event.invitedUsers.find(
        (invite) => invite.userId.toString() === userId.toString()
    );

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(409, `Invitation already ${invitation.status}`);
    }

    invitation.status = action === "accept" ? "accepted" : "declined";

    await event.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                eventId,
                status: invitation.status,
            },
            `Invitation ${invitation.status}`
        )
    );
});

const cancelEvent = asyncHandler(async (req, res) => {
    const {eventId} = req.params
    const event = await Event.findOne({_id: eventId, organizerId: req.user._id });

    if(!event) throw new ApiError(404, "the event not found")

    if(new Date(event.startDateTime) <=  new Date()){
        throw new ApiError(402, "Cannot cancel this event now");
    }

    if (event.status === "cancelled" || event.status === "completed"){
        throw new ApiError(402, "Cannot cancel this event")
    }

    event.status === "cancelled"

    safeNotify(
        () => sendEventCancelledNotification(io, event),
        "sendEventCancelledNotification"
    );

    return res.status(200).json(new ApiResponse(200, event, "The event is cancelled successfully"))

})

const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not Found");
    }

    if (!event.organizerId.equals(req.user._id)) {
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

    if (!event.organizerId.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized to update");
    }

    // if(new Date(event.startDate) < new Date()) throw new ApiError(402, "expired event can't be updated!")

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
        ...(location.address && {"location.address": location.address}),
        ...(location.lat !== undefined && {"location.lat": location.lat}),
        ...(location.lng !== undefined && {"location.lng": location.lng}),
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
        { _id: eventId, organizerId: req.user._id },
        { $set: updateData},
        { new: true }
    );

    safeNotify(
        () => updateEventNotification(io, updatedEvent),
        "updateEventNotification"
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

    const result = await Event.aggregate([
        {
            $match: matchStage,
        },
        {
            $facet: {
                events: [
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
                            localField: "organizerId",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        name: 1,
                                        email: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                            as: "organizer",
                        },
                    },
                    {
                        $unwind: {
                            path: "$organizer",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $addFields: {
                            acceptedHostIds: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: "$hosts",
                                            cond: {
                                                $eq: [
                                                    "$$this.status",
                                                    "accepted",
                                                ],
                                            },
                                        },
                                    },
                                    as: "host",
                                    in: "$$host.userId",
                                },
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "acceptedHostIds",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        name: 1,
                                        email: 1,
                                        avatar: 1,
                                        username: 1,
                                    },
                                },
                            ],
                            as: "coHosts",
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
                            organizerId: "$organizer",
                            hosts: "$coHosts",
                        },
                    },
                ],
                totalCount: [
                    {
                        $count: "count",
                    },
                ],
            },
        },
    ]);

    const publicEvents = result[0]?.events || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events: publicEvents,
                pagination: {
                    currentPage: pageNum,
                    limit: limitNum,
                    totalCount: totalCount,
                    totalPages: Math.ceil(totalCount / limitNum),
                    hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrevPage: pageNum > 1,
                },
            },
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

    const event = await Event.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
        {
            $lookup: {
                from: "users",
                localField: "organizerId",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            avatar: 1,
                        },
                    },
                ],
                as: "organizer",
            },
        },
        { $unwind: { path: "$organizer", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                acceptedHostIds: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$hosts",
                                cond: { $eq: ["$$this.status", "accepted"] },
                            },
                        },
                        in: "$$this.userId",
                    },
                },
            },
        },
        {
            $lookup: {
                from: "User",
                localField: "acceptedHostIds",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: { name: 1, email: 1, avatar: 1 },
                    },
                ],
                as: "coHosts",
            },
        },
        {
            $project: {
                hosts: 0,
                acceptedHostIds: 0,
                organizerId: 0,
            },
        },
    ]);
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
    coHosts,
    privateUserInvitations,
    cancelEvent,
    activeEvent,
    acceptOrDeclineInvitation
};
