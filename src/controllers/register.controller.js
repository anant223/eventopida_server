import { Register } from "../models/register.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const registerEvent = asyncHandler(async (req, res) =>{
    const {eventId} = req.params

    const isUsersubscribered = await Register.findOne({
        event: eventId,
        subscriber: req.user._id,
    });

    if(isUsersubscribered){
        await Register.deleteOne({event: eventId ,subscriber: req.user._id})
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User registration removed successfully"
                )
            );
    }

    const newRegister = await Register.create({
        event: eventId,
        subscriber: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, newRegister, 
        "User registered successfully"
     ))
})

// get all  registered events
const getRegisteredEvents = asyncHandler(async (req, res) =>{
    if(!req.user._id){
        throw ApiError(400, "Not Autherized to get registred Events")
    }
    const allRegistred = await Register.find({subscriber: req.user._id}).populate("event");

    return res.status(200).json(new ApiResponse(200, allRegistred, "All Registred Events"));
})



export {registerEvent, getRegisteredEvents}