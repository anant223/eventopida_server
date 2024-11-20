import User from "../models/user.model";

const generateUniqueUsername = async (email) =>{
    try {
        const baseUsername = email.split("@")[0];
        let uniqueUsername = baseUsername;
        let counter = 1;
        while(await User.findOne({username : uniqueUsername})){
            uniqueUsername = `${baseUsername}${counter}`
            counter++
        }
        return uniqueUsername;
    } catch (error) {
        console.log("Something went wrong with username generator", error);
    }
}

export default generateUniqueUsername;