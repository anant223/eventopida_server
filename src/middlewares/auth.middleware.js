import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";


const JWTverify = asyncHandler(async(req, res, next)=>{
    try {
            const token =
                req.cookies?.accessToken ||
                req.header("Authorization")?.replace("Bearer ","");
            if(!token){
                throw new ApiError(401, "User is not autherized")
            }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select("-refreshToken -password");

        if(!user){
            throw new ApiError(404, "Invaild Access Token")
        }

        req.user = user;

        next()
    } catch (error) {
        throw new ApiError(401, error.message)
    }
})


export default JWTverify;