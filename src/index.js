import dotenv from "dotenv"
import connectDB from "./db/mongoose.js";
import {app, server} from "./app.js";

dotenv.config(
    {
        path: "./.env"
    }
)

connectDB()
.then(() => server.listen(process.env.MY_PORT, function(){
    console.log("⚙️  Server Running on Port : ", process.env.MY_PORT);
}))




