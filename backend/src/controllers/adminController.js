import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOverview = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    pendingPayments,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Booking.countDocuments({}),
    Booking.countDocuments({ status: 'CONFIRMED' }),
    Booking.countDocuments({ status: 'CANCELLED' }),
    Booking.countDocuments({ status: 'PAYMENT_PENDING' }),
    Booking.aggregate([
      { $match: { paymentStatus: { $in: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
  ]);

  const popularDestinationsAgg = await Booking.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'COMPLETED'] } } },
    {
      $group: {
        _id: '$bookingType',
        count: { $sum: 1 },
      },
    },
  ]);

  return new ApiResponse(200, {
    totalUsers,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    pendingPayments,
    totalRevenue: revenueAgg[0]?.total || 0,
    bookingsByType: popularDestinationsAgg,
  }).send(res);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search, role, isActive, page = 1, limit = 20 } = req.query;
  const match = {};
  if (search) match.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  if (role) match.role = role;
  if (isActive !== undefined) match.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    User.find(match).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(match),
  ]);

  const sanitized = results.map(({ password, passwordResetToken, passwordResetExpires, ...rest }) => rest);

  return new ApiResponse(200, sanitized, 'Users retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin' && isActive === false) {
    throw ApiError.badRequest('Cannot deactivate an admin account through this endpoint');
  }
  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });
  return new ApiResponse(200, user.toSafeJSON(), 'User status updated').send(res);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.role = role;
  await user.save({ validateBeforeSave: false });
  return new ApiResponse(200, user.toSafeJSON(), 'User role updated').send(res);
});
