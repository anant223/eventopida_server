import mongoose, {Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        desc: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            trim: true,
            lowercase: true,
            enum: [
                "tech",
                "business",
                "health",
                "education",
                "entertainment",
                "sports",
                "other",
            ],
            default: "other",
        },
        startDateTime: {
            type: Date,
            required: true,
        },
        endDateTime: {
            type: Date,
            required: true,
        },
        eventMode: {
            type: String,
            enum: ["in_person", "online", "hybrid"],
            required: true,
            default: "in_person",
        },
        location: {
            address: {
                type: String,
                default: null,
            },
            city: {
                type: String,
                default: null,
            },
            state: {
                type: String,
                default: null,
            },
            country: {
                type: String,
                default: null,
            },
            countryCode: {
                type: String,
                default: null,
            },
            postalCode: {
                type: String,
                default: null,
            },
            placeId: { type: String, default: null },
            coordinates: {
                type: { type: String, enum: ["Point"], default: "Point" },
                coordinates: { type: [Number], default: undefined}
            },
        },
        online: {
            platform: {
                type: String,
                enum: ["zoom", "google_meet", "teams", "youtube", "custom"],
                default: null,
            },
            link: {
                type: String,
                default: null,
                required: function () {
                    return (
                        this.eventMode === "online" ||
                        this.eventMode === "hybrid"
                    );
                },
            },
            linkVisibility: {
                type: String,
                enum: ["public", "attendees_only"],
                default: "attendees_only",
            },
        },
        totalTickets: {
            type: Number,
            required: function () {
                return this.eventType === "paid";
            },
        },
        availableTickets: {
            type: Number,
            default: function () {
                return this.totalTickets;
            },
            min: 0,
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        hosts: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "declined"],
                    default: "pending",
                },
                invitedAt: {
                    type: Date,
                    default: Date.now,
                },
                respondedAt: Date,
            },
        ],
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        eventType: {
            type: String,
            enum: ["public", "private"],
            default: "public",
            lowercase: true,
        },
        invitedUsers: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "declined"],
                    default: "pending",
                },
                invitedAt: {
                    type: Date,
                    default: Date.now,
                },
                respondedAt: Date,
            },
        ],
        ticketType: {
            type: String,
            enum: ["free", "paid"],
            default: "free",
            lowercase: true,
        },
        price: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            enum: ["USD", "INR"],
            default: "INR",
        },
        requireApproval: {
            type: Boolean,
            default: false,
        },
        token: {
            type: String,
            unique: true,
            sparse: true,
        },
        status: {
            type: String,
            enum: ["draft", "active", "cancelled", "completed"],
            default: "active",
        },
    },
    { timestamps: true }
);
eventSchema.index({ "location.coordinates": "2dsphere" }, { sparse: true });
eventSchema.plugin(mongooseAggregatePaginate);
const Event = model("Event", eventSchema);
export default Event;
