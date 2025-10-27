const sendResponseOld = (res, payload, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    ...payload,
    message,
  });
};
const sendResponse = (
  res,
  data = {},
  message = 'Operation successful',
  statusCode = 200,
  extra = {}
) => {
  const response = { data, message, ...extra };
  res.status(statusCode).json(response);
};

module.exports = {
  sendResponse,
};
