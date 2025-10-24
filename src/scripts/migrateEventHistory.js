import dotenv from "dotenv";
import path from "path"
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Event from "../models/event.model.js";
import {DB_NAME} from "../constant.js"
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.resolve(__dirname, "../../.env")})

const migerateEventHistory = async ()=> {

   try {
       console.log(process.env.MONGODB_URI);
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

       const events = await Event.find({}, { _id: 1, hosts: 1, title: 1 });
       console.log(`📦 Found ${events.length} events to migrate\n`); 
       const bulkOps = [];
       events.forEach((event) => {
           if (event.hosts && event.hosts.length > 0) {
               event.hosts.forEach((hostId) => {
                   bulkOps.push({
                       updateOne: {
                           filter: { _id: hostId },
                           update: {
                               $addToSet: {
                                   "history.organizedEvent": event._id,
                               },
                           },
                       },
                   });
               });
           }
       });

       if (bulkOps.length > 0) {
           const result = await User.bulkWrite(bulkOps);
            
            console.log("=".repeat(50));
            console.log("📊 Migration Summary:");
            console.log("=".repeat(50));
            console.log(`✅ Users matched: ${result.matchedCount}`);
            console.log(`✅ Users modified: ${result.modifiedCount}`);
            console.log(
                `⏭️  Already up to date: ${result.matchedCount - result.modifiedCount}`
            );
            console.log(`📝 Total operations: ${bulkOps.length}`);
            console.log("=".repeat(50) + "\n");
       } else {
           console.log("⚠️  No updates needed\n");
       }

       await mongoose.connection.close();

       process.exit(0);
   } catch (error) {
    console.error("\n💥 Migration failed:", error);

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    process.exit(1);
   }
}


// ✅ Migration completed on October 6, 2025
// Uncomment below to run migration again if needed
// migerateEventHistory();