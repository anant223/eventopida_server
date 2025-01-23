
const asyncHandler = (requesHandler) =>{
    return async (req, res, next) =>{
        try {
            await requesHandler(req, res, next)
        } catch (error) {
            res.status(error.code || 500).json({
                error: error.message,
                success: false,
            });
        }
    }
}
export default asyncHandler;