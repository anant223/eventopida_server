import cookie from "cookie";
import jwt from "jsonwebtoken"
import User from "../../models/user.model.js";
import ApiError from "../../utils/ApiError.js";

export const authenticateSocket = async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            throw new ApiError(401, "No cookie found");
        }

        const cookies = cookie.parse(cookieHeader);
        const token = cookies.accessToken;

        if (!token) {
            throw new ApiError(401, "Access token missing");
        }

        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        if (!decode || !decode._id) {
            throw new ApiError(401, "Invalid token payload");
        }

        const user = await User.findById(decode._id);

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error("❌ Socket auth error:", error);

        if (error.name === "JsonWebTokenError") {
            return next(new ApiError(401, "Invalid token"));
        }

        return next(new ApiError(500, "Authentication error"));
    }
};
