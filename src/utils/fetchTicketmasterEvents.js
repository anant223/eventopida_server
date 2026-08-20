import axios from "axios";

export const fetchTicketmasterEvents = async ({
    city,
    countryCode,
    query = {},
}) => {
    const {
        lat,
        lng,
        radius,
        pageNum,
        fetchSize,
        sortBy,
        sortType
    } = query;

    
    const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json`,
        {
            params: {
                apikey: process.env.TICKETMASTER_API_KEY,
                page: Number(pageNum) || 0,
                size: Number(fetchSize) || 20,
                radius: Number(radius) || 50,
                unit: "km",
                sort:
                    sortBy && sortType
                        ? `${sortBy === "startDateTime" ? "date" : sortBy},${sortType}`
                        : "date,asc",
                ...(!lat && !lng ? { countryCode } : {}),
                ...(city && !lat ? { city } : {}),
                ...(lat && lng
                    ? { latlong: `${lat},${lng}` }
                    : { latlong: "40.7128,-74.0060" }),
            },
            timeout: 8000,
        }
    );

    const pageInfo = response.data.page || {};
    const rawEvents = response.data._embedded?.events || [];
    const now = new Date();

    const validEvents = rawEvents.filter((event) => {
        const startDateTimeRaw = event.dates?.start?.dateTime;
        const venue = event?._embedded?.venues?.[0];
        if (!startDateTimeRaw) return false;
        if (!venue?.location?.latitude || !venue?.location?.longitude)
            return false;
        return new Date(startDateTimeRaw) > now;
    });

    const simplified = await Promise.all(
        validEvents.map(async (event) => {
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
                category:
                    event.classifications
                        ?.map((c) => c.segment?.name)
                        .filter(Boolean) ?? [],
                startDateTime: event.dates?.start?.dateTime || null,
                endDateTime:
                    event.dates?.end?.dateTime ||
                    event.dates?.start?.dateTime ||
                    null,
                location: {
                    address: venue?.name
                        ? `${venue.name}, ${venue.city?.name || ""}`
                        : "online",
                    coordinates: [venue?.location?.longitude, venue?.location?.latitude],
                    placeId: venue?.id || null,
                },
                ticketType: event.priceRanges?.length ? "paid" : "free",
                price: event.priceRanges?.[0]?.min ?? 0,
                currency: event.priceRanges?.[0]?.currency || "USD",
                eventType: "public",
                status: "active",
                source: "ticketmaster",
                externalUrl: event.url,
            };
        })
    );

    return {
        events: simplified,
        page: pageInfo,
        totalCount: pageInfo.totalElements || 0,
    };
};
