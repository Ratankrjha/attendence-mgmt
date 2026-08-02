const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Attendance already exists. Do not create duplicate records.",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong on the server",
  });
};

module.exports = errorHandler;
