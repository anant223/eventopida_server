import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.model.js";
import Like from "../models/like.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import sendMail from "../utils/mailers.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import generateRefreshAndAccessToken from "../utils/genrateToken.js";


const registerUser = asyncHandler(async (req, res) => {
    // requed by user
    const { email, password, username } = req.body;
    
    // checking if user have filled the form or not
    if ([email, password, username].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    // checking if user exsit or not
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existingUser) {
        throw new ApiError(409, "username or email already exist");
    }

    // creating  new user
    const user = await User.create({ email, password, username });

    // selecting what to send
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const data = {
        to: email,
        subject: "Eventopia Confirmation",
        text: "You have successfully become part of eventopia community",
        html: "<b>You have successfully become part of the Eventopia community</b>",
    };

    const confirmationMail = await sendMail(data);
    if (!confirmationMail) {
        throw new ApiError(500, "Somthing went worng with mailer");
    }

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user");
    }

    // sending response
    return res
        .status(200)
        .json(new ApiResponse(201, createdUser, "User registred successfully"));
});

const login = asyncHandler(async (req, res) => {
    // login request
    const { username, email, password } = req.body;
    // Checking if all fields have been filled or not.
    if (!username && !email) {
        throw new ApiError(400, "username or email required");
    }

    // Checking if user exist or not
    const user = await User.findOne({ $or: [{ username }, { email }] }).select("+password");
    if (!user) {
        throw new ApiError(404, "Incorrect username or email");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(404, "Wrong Password");
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const isProduction = process.env.NODE_ENV === "production";

    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Strict",
        maxAge: 24 * 60 * 60 * 1000,
    };


    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                },
                "User logged in Successfully"
            )
        );
});

const logout = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "User is not found")
    }

    await User.findByIdAndUpdate(req?.user?._id,
        {
            $unset :{
                refershToken : 1
            },
        },
        {
            new: true
        }
    )

    const isProduction = process.env.NODE_ENV === "production";

    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Strict",
        maxAge: 24 * 60 * 60 * 1000,
    };

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});


const currentUser = asyncHandler(async (req, res) => {
    return await res
        .status(200)
        .json(new ApiResponse(200, req.user, "Here is the user"));
});

const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // when they click the mail i get userId
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "Wrong email");
    }

    const resetToken = user.generateResetToken();

    if (!resetToken) {
        throw new ApiError(502, "JWT Token is not able to generate!");
    }

    const resetLink = `${process.env.MY_PORT}/reset-password?token=${resetToken}`;

    const data = {
        to: email,
        subject: "Eventopia Reset Password Link",
        text: `Click this link to reset your password: ${resetLink}`,
        html: `<a href="${resetLink}">Reset Password</a>`,
    };
    sendMail(data);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Reset Link was sent successfully!"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!(token && newPassword)) {
        throw new ApiError(402, "new Password required");
    }

    let veryfyToken;
    try {
        veryfyToken = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    } catch (error) {
        throw ApiError(402, "Token has been expired or invaild");
    }

    const user = await User.findById(veryfyToken?._id);

    user.password = newPassword;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset sucessfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies?.accessToken || req.body.accessToken;
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unautherized request");
    }
    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invaild refersh token");
        }

        if (incommingRefreshToken !== user?.refershToken) {
            throw new ApiError(401, "Refreshed token is expired or used");
        }

        const isProduction = process.env.NODE_ENV === "production";

        const options = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        };

        const { accessToken, newRefreshToken } =
            await generateRefreshAndAccessToken(user._id);

        return res
            .status(200)
            .cookie("refreshAccessToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refershToken: newRefreshToken,
                    },
                    "Access Token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    
    const { name, bio, socialLinks } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
        throw ApiError(402, "Unautherized to update profile");
    }
   
    if (name) user.name = name;
    if (bio) user.bio = bio;

    if(socialLinks && Array.isArray(socialLinks)){
        socialLinks.forEach(link => {
            if(link.platform){
                link.platform == link.platform.toLowerCase();
            }
        })
        user.socialLinks = socialLinks
    }

    const updatedUser = await user.save();

    if (!updatedUser) {
        throw ApiError(502, "Somthing went wrong while updating user profile");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(202, updatedUser, "Profile updated successfully")
        );
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassworld, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassworld);

    if (!isPasswordValid) {
        throw new ApiError(401, "needed correct password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(202, "Password changed successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = await req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar is missing");
    }
    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!newAvatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: newAvatar.url,
            },
        },
        { new: true }
    ).select("-password");

    if (user.avatar) {
        await cloudinary.uploader.destroy(user.avatar);
    }

    return res
        .status(200)
        .json(new ApiResponse(202, user, "Avatar updated successfully"));
});

const userLikedEvents = asyncHandler(async (req, res) => {
    const like = await Like.find({ likedBy: req.user._id });
    if (!like) {
        throw ApiError(404, "No event is liked by you");
    }
    return res.status(200).json(200, like, "Events Liked by user");
});

export {
    registerUser,
    login,
    logout,
    currentUser,
    forgetPassword,
    refreshAccessToken,
    updateUserProfile,
    changePassword,
    updateAvatar,
    resetPassword,
    userLikedEvents,
};
