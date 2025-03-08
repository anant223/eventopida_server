import { Register } from "../models/register.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const registerEvent = asyncHandler(async (req, res) =>{
    const {eventId} = req.params

    const isUsersubscribered = await Register.findOne({
        event: eventId,
        subscriber: req.user._id,
    });

    console.log(isUsersubscribered);
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
        isSubscribed: true
    });

    return res.status(200).json(new ApiResponse(200, newRegister, 
        "User registered successfully"
     ))
})

const getRegisteredEvents = asyncHandler(async (req, res) =>{
    const allRegistred = await Register.find({subscriber: req.user._id}).populate("event");
    if(!allRegistred){
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "No Registred Events"
                )
            );
    }
    const registred = allRegistred.map((register) => register.event)
    return res.status(200).json(new ApiResponse(200, registred, "All Registred Events"));
})

export {registerEvent, getRegisteredEvents}