// responseHandler.js

export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data
  });
};

export const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message
  });
};

// export const successResponse = (res, data, statusCode = 200) => {
//   return res.status(statusCode).json(data);
// };
