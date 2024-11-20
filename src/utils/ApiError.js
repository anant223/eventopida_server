class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something Went Wrong",
        stack = "",
        errors = []
    ){
        super(message)
        this.statusCode = statusCode
        this.errors = errors,
        this.data = null,
        this.sucess = false

        if (stack) {
          this.stack = stack;
        } else {
          Error.captureStackTrace(this, this.constructor);
        }

    }
}

export default ApiError;