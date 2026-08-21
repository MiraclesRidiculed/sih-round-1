export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl
  });
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};

