import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const match = { user: req.user._id };
  if (unreadOnly === 'true') match.isRead = false;

  const skip = (page - 1) * limit;
  const [results, total, unreadCount] = await Promise.all([
    Notification.find(match).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Notification.countDocuments(match),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return new ApiResponse(200, results, 'Notifications retrieved', {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  }).send(res);
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw ApiError.notFound('Notification not found');
  notification.isRead = true;
  await notification.save();
  return new ApiResponse(200, notification).send(res);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return new ApiResponse(200, null, 'All notifications marked as read').send(res);
});
