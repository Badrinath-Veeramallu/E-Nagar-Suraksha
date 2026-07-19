const Notification = require('../models/Notification');

// @desc   Get my notifications
// @route  GET /api/notifications/my
// @access Private
const getMyNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('relatedComplaint', 'complaintId title status');

        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        const total = await Notification.countDocuments({ recipient: req.user._id });

        res.json({ success: true, count: notifications.length, total, unreadCount, data: notifications });
    } catch (err) { next(err); }
};

// @desc   Mark a notification as read
// @route  PUT /api/notifications/:id/read
// @access Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, message: 'Marked as read' });
    } catch (err) { next(err); }
};

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read-all
// @access Private
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
