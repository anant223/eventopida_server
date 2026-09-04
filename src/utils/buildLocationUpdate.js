import ApiError from "./ApiError.js";

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
        coordinates,
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
    if (coordinates != null) {
        // Accept either a flat [lng, lat] array, or the nested
        // { type: "Point", coordinates: [lng, lat] } shape (e.g. when
        // editing an existing event whose location came straight from the DB).
        const coordsArray = Array.isArray(coordinates)
            ? coordinates
            : coordinates.coordinates;

        if (!Array.isArray(coordsArray) || coordsArray.length !== 2) {
            throw new ApiError(400, "Invalid coordinates");
        }

        const [lng, lat] = coordsArray;

        if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            isNaN(lat) ||
            isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            throw new ApiError(400, "Invalid coordinates");
        }

        locationUpdate.coordinates = {
            type: "Point",
            coordinates: [lng, lat],
        };
    }
    return locationUpdate;
};

