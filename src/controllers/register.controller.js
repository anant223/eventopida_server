import Event from "../models/event.model.js";
import EventRegistration from "../models/register.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { safeNotify } from "../utils/index.js";

const registerEvent = asyncHandler(async (req, res) =>{
    const {eventId} = req.params

    const event = await Event.findById(eventId);

    if(!event){
        throw new ApiError(404, "Event not found")
    }

    if (event.ticketType !== "free") {
        throw new ApiError(
            403,
            "Paid events require payment before registration"
        );
    }

    if(["cancelled", "completed"].includes(event.status)){
        throw new ApiError(400, "Cannot register for this event");
    }

    const existingRegistration = await EventRegistration.findOne({
        event: event._id,
        subscriber: req.user._id,
    });

    if(existingRegistration){
        await EventRegistration.deleteOne({
            event: eventId,
            subscriber: req.user._id,
            });
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {},
                        "Unregistered successfully"
                    )
                );
        }
        const newRegister = await EventRegistration.create({
            event: eventId,
            subscriber: req.user._id,
        });
        safeNotify(() => newUserRegisterEventNotification(event, req.user._id))

        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    newRegister,
                    "User registered successfully"
                )
            );
    
})



// get all  registered events
const getRegisteredEvents = asyncHandler(async (req, res) =>{
    if(!req.user._id){
        throw ApiError(400, "Not Autherized to get registred Events")
    }
    const allRegistred = await EventRegistration.find({subscriber: req.user._id}).populate("event");

    return res.status(200).json(new ApiResponse(200, allRegistred, "All Registred Events"));
})




export {registerEvent, getRegisteredEvents}