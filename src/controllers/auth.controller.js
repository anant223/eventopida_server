import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";
import axios from "axios"
import query from "querystring";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import generateRefreshAndAccessToken from "../utils/genrateToken.js";
import { URLSearchParams } from "url";


const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);



const googleAuth = asyncHandler((req, res) => {
    const authUri = oauth2Client.generateAuthUrl({
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        access_type: "offline",
        prompt: "consent",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    res.redirect(authUri);
});


const callbackAuth = asyncHandler( async (req, res) => {
    const  {code, error} = req.query;
    if(error){
        return res.redirect(`${process.env.CLIENT_URI}/auth?type=login`);
    }
    if(!code){
        throw new ApiError(404, "No autherization code provided")
    }

    // exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
    });
    const { data } = await oauth2.userinfo.get();
    const { email, name, picture} = data;




    let user = await User.findOne({ email })
    let isNewUser = false;



    if(!user){
        user = await User.create({
            email : email,
            username:  email.split("@")[0],
            avatar: picture,
            name
        })
        isNewUser = true;
    }
    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
        user._id.toString()
    );


    user.refreshToken = refreshToken
    await user.save();

    user = await User.findById(user._id).select(
        "-refreshToken"
    );


    const isProduction = process.env.NODE_ENV === "production";
    console.log(isProduction);
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
        .redirect(`${process.env.CLIENT_URI}/main/all-events`)
    
});


const discord_cofig = {
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type : "code",
    scope: "identify email",
};
const discordAuth = asyncHandler((req, res) => {
    const params = query.stringify(discord_cofig)
    return res.redirect(`https://discord.com/api/oauth2/authorize?${params}`)
})

const discordCallbackAuth = asyncHandler( async(req, res) =>{
    const {code, error} = req.query;

    if(error){
        return res.redirect(`${process.env.CLIENT_URI}/auth?type=login`);
    }


    if(!code){
        new ApiError(400, "No autherization code provided");
    }

        const token = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
                code,
                scope: "identify email",
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const {access_token } = token.data;

        const userinfo = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                "Authorization": `Bearer ${access_token}`
            },
        });
        const {email, username, avatar, global_name} = userinfo.data
        let user = await User.findOne({email})
        let isNewUser = false;

        if(!user){
            user = await User.create({
                username,
                avatar,
                name: global_name,
                email,
            })
            isNewUser = true;
        }
        const { refreshToken, accessToken } =
            await generateRefreshAndAccessToken(user._id.toString());
        
        user.refreshToken = refreshToken;
        await user.save();

        user = await User.findById(user._id).select("-refreshToken");

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
            .redirect(`${process.env.CLIENT_URI}/main/all-events`)
})

export { googleAuth, callbackAuth, discordCallbackAuth, discordAuth};
