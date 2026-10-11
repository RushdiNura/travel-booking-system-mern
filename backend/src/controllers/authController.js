import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { logger } from '../utils/logger.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const sendAuthResponse = (res, statusCode, user, message) => {
  const token = signToken(user._id);
  setAuthCookie(res, token);
  return new ApiResponse(statusCode, { user: user.toSafeJSON(), token }, message).send(res);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone });
  logger.info(`New user registered: ${user._id}`);

  return sendAuthResponse(res, 201, user, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +failedLoginAttempts +lockUntil'
  );

  // Same generic message whether the email doesn't exist or the password
  // is wrong — avoids leaking which emails are registered.
  const invalidCredsError = () => ApiError.unauthorized('Invalid email or password');

  if (!user) throw invalidCredsError();

  if (user.isLocked()) {
    throw ApiError.forbidden('Account temporarily locked due to repeated failed attempts. Try again later.');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw invalidCredsError();
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact support for help.');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateBeforeSave: false });

  return sendAuthResponse(res, 200, user, 'Logged in successfully');
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return new ApiResponse(200, null, 'Logged out').send(res);
});

export const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, { user: req.user.toSafeJSON() }).send(res);
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatar, address, preferences } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar !== undefined) updates.avatar = avatar;
  if (address !== undefined) updates.address = address;
  if (preferences !== undefined) updates.preferences = { ...req.user.preferences.toObject(), ...preferences };

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return new ApiResponse(200, { user: user.toSafeJSON() }, 'Profile updated').send(res);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return sendAuthResponse(res, 200, user, 'Password updated successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always return the same response, whether or not the account exists,
  // to avoid leaking account existence via timing/response differences.
  const genericMessage = 'If an account exists for that email, a reset link has been sent.';

  if (!user) {
    return new ApiResponse(200, null, genericMessage).send(res);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Email dispatch is handled by the notification service (see services/notificationService.js).
  // Wiring here is intentionally left to that service so SMTP config lives in one place.
  const { sendPasswordResetEmail } = await import('../services/emailService.js');
  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error(`Failed to send password reset email: ${err.message}`);
    throw ApiError.internal('Could not send reset email, please try again later');
  }

  return new ApiResponse(200, null, genericMessage).send(res);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Reset link is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendAuthResponse(res, 200, user, 'Password reset successfully');
});
