const ErrorResponse = require("../helpers/error-response");

const errorHandle = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  console.log("Error handle : ", error);

  // MongoDB bad ObjectID
  if (err.name === "CastError") {
    const message = `not found`;
    error = new ErrorResponse(message, 404);
  }

  // MongoDB validation failed
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((error) => error.message);
    error = new ErrorResponse(message, 400);
  }

  // MongoDB duplicate value
  if (err.code === 11000) {
    let message = error.message.split("index: ")[1].split("_1 dup key")[0];
    message = `${message} is taken`;
    error = new ErrorResponse(message, 400);
  }

  // Token expired
  if (error.name === "TokenExpiredError") {
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
    data: null,
  });
};

module.exports = errorHandle;
