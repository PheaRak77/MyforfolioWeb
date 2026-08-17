const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  if (err.name === "JsonWebTokenError" || err.name === "jsonwebtokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if (err.code === "23505") {
    statusCode = 409;
    message = "Resource already exists";
  }

  if (err.code === "23503" || err.error === 23503) {
    statusCode = 400;
    message = "Invalid reference data";
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
