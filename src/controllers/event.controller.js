import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Joi from "joi"
import Event from "../models/event.model.js";
import User from "../models/user.model.js";


const createEvent = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "Unautherized to create event");
    }

    const schema = Joi.object({
        title: Joi.string().required(),
        desc: Joi.string().required(),
        duration: Joi.number().required(),
        startingDate: Joi.date().required(),
        url: Joi.string().uri().required(),
        status: Joi.string().required(),
        owner: Joi.string().required(),
        eventType: Joi.string().valid("Public", "Private").required()
    });
    
    const {error, value} = schema.validate(req.body)
    const { thumbnail } = req.file;

    if (error) {
        throw new ApiError(402, error.details[0].message);
    }

    if(!thumbnail){
        throw new ApiError(400, "Image is required!")
    }

    const thumbnailLocalPath = await thumbnail?.path;

    const thumbnailImg =  await uploadOnCloudinary(thumbnailLocalPath)
    const cloudinaryUrl = thumbnailImg.url

    const newEvent = await Event.create({...value, owner : req.user._id, cloudinaryUrl});

    return res
    .status(200)
    .json(new ApiResponse(200, newEvent,"Event has been created successfully!"));
})

const deleteEvent = asyncHandler(async (req, res) =>{
    const event = await Event.findById(req.user?._id);
    if(!event){
        throw new ApiError(404, "Event not Found")
    }

    if(event.owner !== req.user?._id){
        throw new ApiError(403, "Unautherized to delete this event")
    }


    await Event.findByIdAndDelete(event._id);

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Event deleted successfully"));
})

const updateEvent = asyncHandler (async (req, res) =>{
    const {startingDate, eventType} = req.body

    const event = await Event.findById(req.user?._id);
    if(!event){
        throw new ApiError(404, "Event not Found");
    }

     if (event.owner !== req.user?._id) {
         throw new ApiError(403, "Unautherized to delete this event");
     }

    const updatedEventType = await Event.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                startingDate,
                eventType
            }
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, updatedEventType, "Event Updated sucessfully!"))
})

const allPublicEvent = asyncHandler( async (req, res) =>{
    const { page = 1, limit = 6, query, sortBy= startingDate, sortType, userId } = req.query;

    const publicEvent = await Event.aggregate([
        {
            $match: {
                eventType: "Public",
                status: "upcoming",
            },
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: limit,
        },
        {
            $sort: {
                sortBy: 1,
            },
        },

        {
            $project: {
                title: 1,
                desc: 1,
                thumbnail: 1,
                duration: 1,
                startingDate: 1,
                url: 1,
                tag: 1,
                status: 1,
                owner: 1,
                eventType: 1,
            },
        },
    ]);


    return res
    .status(200)
    .json(new ApiResponse(200,{count:publicEvent?.length, events: publicEvent}, "All Public Event!"))

})

const allPrivateEvent = asyncHandler(async (req, res) => {

    const privateEvent = await Event.aggregate([
        {
            $match: {
                eventType: "Private",
                status: "upcoming",
                participants: req.user._id
            },
        },
        {
            $sort: {
                startingDate: 1,
            },
        },
        {
            $project: {
                title: 1,
                desc: 1,
                thumbnail: 1,
                duration: 1,
                startingDate: 1,
                url: 1,
                tag: 1,
                status: 1,
                owner: 1,
                eventType: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { count: privateEvent?.length, events: privateEvent },
                "All Private Event!"
            )
        );
});

const findEventById = asyncHandler(async (req, res) =>{
    const {eventId} = req.params

    const event = await Event.findById(eventId);

    if(!event){
        throw new ApiError(404, "Not found!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, event, ""))


})





export {
    createEvent, 
    deleteEvent, 
    updateEvent, 
    allPublicEvent,
    allPrivateEvent,
    findEventById
}
