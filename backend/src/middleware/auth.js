import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * Requires a valid JWT. Attaches the full user document (minus secrets)
 * to req.user. Authorization decisions must always be re-checked here —
 * a frontend role check is never sufficient on its own (see `requireRole`).
 */
export const protect = asyncHandler(async (req, _res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('You must be logged in to access this resource');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired session, please log in again');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('The user for this session no longer exists');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }
  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was recently changed, please log in again');
  }

  req.user = user;
  next();
});

/**
 * Attaches req.user if a valid token is present, but does not reject the
 * request otherwise. Useful for endpoints that behave differently for
 * logged-in users (e.g. showing "already reviewed") without requiring auth.
 */
export const attachUserIfPresent = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user?.isActive) req.user = user;
  } catch {
    // Invalid/expired token on an optional-auth route: proceed as a guest.
  }
  next();
});

/** Restricts a route to one or more roles. Always used after `protect`. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
  next();
};

/**
 * Ensures the authenticated user owns the resource identified by
 * `getOwnerId(req)`, unless they're an admin. Guards against IDOR — e.g.
 * a user passing another user's booking id in the URL.
 */
export const requireOwnerOrAdmin = (getOwnerId) => (req, _res, next) => {
  if (req.user.role === 'admin') return next();
  const ownerId = getOwnerId(req);
  if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have access to this resource');
  }
  next();
};
