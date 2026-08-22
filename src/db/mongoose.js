import { DB_NAME } from "../constant.js";
import mongoose from "mongoose";
import Event from "../models/event.model.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        await Event.syncIndexes();

        console.log(
            `\n✅ MongoDB Connected || DB Host : ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("MongoDB connection has been failed:", error);
        process.exit(1);
    }
};

export default connectDB;
