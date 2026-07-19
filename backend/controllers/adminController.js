const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');

// @desc   Admin dashboard summary
// @route  GET /api/admin/dashboard
// @access Admin
const getDashboard = async (req, res, next) => {
    try {
        const [total, statusGroups, slaBreach, escalated, resolvedToday] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Complaint.countDocuments({ slaBreached: true, status: { $nin: ['resolved', 'closed'] } }),
            Complaint.countDocuments({ escalated: true, status: { $nin: ['resolved', 'closed'] } }),
            Complaint.countDocuments({
                status: 'resolved',
                resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            }),
        ]);

        const userCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]);

        const statusMap = {};
        statusGroups.forEach((s) => { statusMap[s._id] = s.count; });

        res.json({
            success: true,
            data: {
                total,
                statusBreakdown: statusMap,
                slaBreach,
                escalated,
                resolvedToday,
                userCounts: userCounts.reduce((acc, u) => { acc[u._id] = u.count; return acc; }, {}),
            },
        });
    } catch (err) { next(err); }
};

// @desc   Analytics
// @route  GET /api/admin/analytics
// @access Admin
const getAnalytics = async (req, res, next) => {
    try {
        const [byCategory, byDept, avgResolutionTime, feedbackStats, monthlyTrend] = await Promise.all([
            Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
            Complaint.aggregate([
                { $match: { assignedDepartment: { $ne: null } } },
                { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
                { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
                { $unwind: '$dept' },
                { $project: { name: '$dept.name', count: 1 } },
            ]),
            Complaint.aggregate([
                { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
                { $project: { duration: { $subtract: ['$resolvedAt', '$createdAt'] } } },
                { $group: { _id: null, avg: { $avg: '$duration' } } },
            ]),
            Complaint.aggregate([
                { $match: { 'feedback.rating': { $exists: true } } },
                { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
            ]),
            Complaint.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                byCategory: byCategory.reduce((a, c) => { a[c._id] = c.count; return a; }, {}),
                byDepartment: byDept,
                avgResolutionTimeHours: avgResolutionTime[0] ? (avgResolutionTime[0].avg / 3600000).toFixed(1) : null,
                feedback: feedbackStats[0] || { avgRating: null, count: 0 },
                monthlyTrend: monthlyTrend.reverse(),
            },
        });
    } catch (err) { next(err); }
};

// @desc   Get audit logs
// @route  GET /api/admin/audit-logs
// @access Admin
const getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, action } = req.query;
        const query = action ? { action } : {};
        const logs = await AuditLog.find(query)
            .populate('actor', 'name email role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(query);
        res.json({ success: true, count: logs.length, total, data: logs });
    } catch (err) { next(err); }
};

module.exports = { getDashboard, getAnalytics, getAuditLogs };
