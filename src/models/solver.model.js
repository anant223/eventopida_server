import mongoose, {model} from "mongoose";

const solverSchema = new model({
    
}, { timestamps: true });

const Solver = mongoose.model("Solver", solverSchema);
export default Solver