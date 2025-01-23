import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";


const createEvent = asyncHandler(async (req, res) => {

    const { title, desc, duration, startingDate, url, eventType, tag } = req.body;
    const thumbnail = await req.file?.path;
    if (
        [title, desc, duration, startingDate, url, eventType, tag].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(401, "Unauthorized to create event");
    }
    console.log(thumbnail);
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail image is required");
    }
   
    const thumbnailImg = await uploadOnCloudinary(thumbnail);
    if (!thumbnailImg || !thumbnailImg.url) {
        throw new ApiError(400, "Error uploading image to cloudinary");
    }
    const newEvent = await Event.create({
        title,
        desc,
        duration,
        startingDate,
        url,
        eventType,
        owner: req.user._id,
        thumbnail: thumbnailImg?.url,
        tag,
    });
    console.log("new event",newEvent);
  

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
    const { page = 1, limit = 6, sortBy, sortType } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1) {
        throw new ApiError(400, "Invalid page or limit values");
    }


    const publicEvent = await Event.aggregate([
        {
            $match: {
                eventType: "Public",
                status: "upcoming",
            },
        },
        {
            $skip: (pageNum - 1) * limitNum,
        },
        {
            $limit: limitNum,
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
