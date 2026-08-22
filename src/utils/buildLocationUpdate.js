import ApiError  from "./ApiError.js";

export const parseLocation = (location) => {
    if (!location) return undefined;

    const {
        address,
        city,
        state,
        country,
        countryCode,
        postalCode,
        placeId,
        lat,
        lng,
    } = location;

    const locationUpdate = {
        address: address ?? null,
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
        countryCode: countryCode ?? null,
        postalCode: postalCode ?? null,
        placeId: placeId ?? null,
    };

    if (lat != null && lng != null) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        if (
            isNaN(parsedLat) ||
            isNaN(parsedLng) ||
            parsedLat < -90 ||
            parsedLat > 90 ||
            parsedLng < -180 ||
            parsedLng > 180
        ) {
            throw new ApiError(400, "Invalid coordinates");
        }

        locationUpdate.coordinates = {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
        };
    }

    return locationUpdate;
};
