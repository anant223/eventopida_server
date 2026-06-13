import  Waitlist  from "../models/waitlist.model.js"
import asyncHandler  from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js";


const createWaitList = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const exists = await Waitlist.exists({ email });

    if (exists) {
        throw new ApiError(400, "This email already exists");
    }

    const waitlist = await Waitlist.create({ email });

    return res
        .status(201)
        .json(
            new ApiResponse(201, waitlist, "Successfully joined the waitlist")
        );
});

export { createWaitList};