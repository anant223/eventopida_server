import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const socialLinksSchema = new Schema({
    platform: {
        type: String,
        trim: true,
        lowercase: true,
        enum: [
            "twitter",
            "linkedin",
            "instagram",
            "youtube",
            "discord",
            "website",
            "other"
        ], 
    },
    url: {
        type: String,
        trim: true,
        maxlength: 300,
        match: [                 
            /^https?:\/\/.+/,
            "URL must start with http:// or https://"
        ]
    },
}, {_id: false});

const userSchema = new Schema(
    {
        username: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: false,
            select: false,
        },
        avatar: {
            type: String,
        },
        bio: {
            type: String,
        },
        socialLinks: [socialLinksSchema],
        interests: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],
        preferredCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],

        history: {
            attendedEvent: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Event",
                },
            ],
            organizedEvent: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Event",
                },
            ],
        },  
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
        notificationPreferences: {
            eventCreated: {
                type: Boolean,
                default: true,
            },
            eventInvite: {
                type: Boolean,
                default: true,
            },
            coHostAdded: {
                type: Boolean,
                default: true,
            },
            eventReminder: {
                type: Boolean,
                default: true,
            },
            eventCancelled: {
                type: Boolean,
                default: true,
            },
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], 
            },
            city: {
                type: String,
            },
            country: {
                type: String,
            },
            formattedAddress: String,
            placeId: String,
        },

        accountId: {
            type: String,
            default: null,
        },
        stripeOnboardingCompleted: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    let User = this.constructor;

    if(!this.username){
        let baseUserName = this.email.split("@")[0];
        let uniqueUserName = baseUserName;
        let counter = 1;

        while (await User.exists({ username: uniqueUserName })) {
            uniqueUserName = `${uniqueUserName} ${counter}`;
            counter++;
        }

        this.username = uniqueUserName;
    }
    next();

})

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function (secret, expiry) {
    try {
        return jwt.sign(
            {
                _id: this._id,
                username: this.username,
            },
            secret,
            {
                expiresIn: expiry,
            }
        );
    } catch (error) {
        console.error("Error generating token:", error);
        return null;
    }
};

userSchema.methods.generateRefreshToken = function () {
    return this.generateToken(
        process.env.REFRESH_TOKEN_SECRET, 
        process.env.REFRESH_TOKEN_EXPIRY
    );
};

userSchema.methods.generateAccessToken = function () {
    return this.generateToken(
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRY
    );
};

userSchema.methods.generateResetToken = function () {
    try {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.JWT_SECRET_TOKEN,
            {
                expiresIn: "5m",
            }
        );
    } catch (error) {
        console.error("Error generating token:", error);
        return null;
    }
}

const User = mongoose.model("User", userSchema);
export default User;
