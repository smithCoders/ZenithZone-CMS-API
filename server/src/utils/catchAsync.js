const AppError=require("./appError")
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
            // Check if the error is an instance of AppError
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({
                    status: err.status,
                    message: err.message,
                });
            }

            // If not, treat it as a 500 internal server error
            console.error('Unhandled Error:', err);
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
            });
        });
    };
};

module.exports = catchAsync;
