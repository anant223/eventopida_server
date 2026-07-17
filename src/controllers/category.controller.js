import  Category  from "../models/category.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { categories },
                "Categories fetched successfully"
            )
        );
});



export { getCategories };
