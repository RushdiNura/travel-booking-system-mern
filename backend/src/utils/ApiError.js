/**
 * Standard application error. Route/controller code throws these; the
 * global error handler middleware turns them into consistent JSON responses
 * and never leaks a raw stack trace to the client.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Not authorized to perform this action') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Conflicting state') {
    return new ApiError(409, message);
  }
  static unprocessable(message = 'Unprocessable request', details) {
    return new ApiError(422, message, details);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
  static internal(message = 'Something went wrong on our end') {
    return new ApiError(500, message);
  }
}
