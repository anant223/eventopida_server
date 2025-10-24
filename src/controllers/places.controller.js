import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

const placeAutocomplete = asyncHandler(async (req, res) => {
    console.log(req.query);
    const { input } = req.query;

    const url = `https://places.googleapis.com/v1/places:autocomplete`;


    if (!input) {
        throw new ApiError(400, "No Place found");
    }


    try {
        const location = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.Google_MAP_API_KEY,
            },
            body: JSON.stringify({
                input: input,
                languageCode: "en",
            }),
        });

        const jsonData = await location.json()
        console.log("✅ Google API success:", jsonData);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    jsonData.suggestions,
                    "Location found successfully"
                )
            );
    } catch (error) {
        console.error(
            "❌ Google API error:",
            error.response?.data || error.message
        );
        console.log("🔑 API key used:", process.env.GOOGLE_PLATFORM_API_KEY);

        // You’ll now see *why* it’s failing (API key, billing, restriction, etc.)
        throw new ApiError(
            error.response?.status || 500,
            error.response?.data?.error_message || "Google API Error"
        );
    }
});

export { placeAutocomplete };
