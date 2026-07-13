import axios from "axios";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };
countries.registerLocale(en);


export const liveEventsPreview = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const {
        lat: queryLat,
        lng: queryLng,
        page,
        size,
        radius,
    } = req.query;

    const location = user.location || {};
    const { coordinates, city, country } = location;

    const countryCode =
        (country && countries.getAlpha2Code(country, "en")) || "US";
    
    const lat = queryLat ? parseFloat(queryLat) : location.coordinates?.lat;
    const lng = queryLng ? parseFloat(queryLng) : location.coordinates?.lng;


    const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json`,
        {
            params: {
                apikey: `7XAyi11R14367JeGGHxa6OfzABJoDDlx`,
                page: Number(page),
                size: Number(size),
                radius: Number(radius),
                unit: "km",
                ...(!queryLat && !queryLng ? { countryCode } : {}),
                ...(city && !queryLat ? { city } : {}),
                ...(lat && lng
                    ? { latlong: `${lat},${lng}` }
                    : { latlong: "40.7128,-74.0060" }),
            },
        }
    )

    const pageInfo = response.data.page || {};


    const rawEvents = response.data._embedded?.events || [];

    const now = new Date();

    const validEvents = rawEvents.filter((event) => {
        const statusCode = event.dates?.status?.code;
        const startDateTimeRaw = event.dates?.start?.dateTime;
        const venue = event?._embedded?.venues?.[0];

        if (!startDateTimeRaw) return false;
        if(!venue?.location?.latitude || !venue?.location?.longitude) return false

        const startDateTime = new Date(startDateTimeRaw);
        return startDateTime > now;
    });


    const simplifiedEvents = await Promise.all(validEvents?.map(async (event) => {
        const venue = event?._embedded?.venues?.[0];

        return {
        _id: event.id,
        title: event.name,
        image:
            event.images?.find(
                (img) => img.ratio === "16_9" && img.width >= 640
            )?.url ||
            event.images?.[0]?.url ||
            null,
        category: event.classifications.map(category => category.segment.name),
        startDateTime: event.dates?.start?.dateTime || null,
        endDateTime: event.dates?.end?.dateTime || event.dates?.start?.dateTime || null,
        location: {
            address: venue?.name
                ? `${venue?.name}, ${venue?.city?.name || ""}`
                : "online",
            lat: venue?.location?.latitude,
            lng: venue?.location.longitude,
        },
        locationId: venue.id || null,
        ticketType: event.priceRanges?.length ? "paid" : "free",
        price: event.priceRanges?.[0]?.min ?? 0,
        currency: event.priceRanges?.[0]?.currency || "USD",
        eventType: "public",
        status: "active",
        source: "ticketmaster",
        externalUrl: event.url,
    }}));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events: simplifiedEvents,
                page: {
                    size: pageInfo.size,
                    totalElements: pageInfo.totalElements,
                    totalPages: pageInfo.totalPages,
                    number: pageInfo.number,
                },
            },
            "Live data fetched successfully!"
        )
    );
});
