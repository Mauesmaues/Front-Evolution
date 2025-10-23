module.exports = {
  // success: data, optional message
  success: (data, message = '') => ({ success: true, data, message, error: null }),
  // error: top-level message and an error object with details
  error: (message, error = null) => ({ success: false, data: null, message, error: { message, details: error } })
};