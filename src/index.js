import dotenv from "dotenv"
import connectDB from "./db/mongoose.js";
import app from "./app.js";

dotenv.config(
    {
        path: "./.env"
    }
)

connectDB()
.then(() => app.listen(process.env.MY_PORT, function(){
    console.log("⚙️  Server Running on Port : ", process.env.MY_PORT);
}))




