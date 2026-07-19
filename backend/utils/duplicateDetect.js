const Complaint = require('../models/Complaint');

/**
 * Detect nearby duplicate complaints within ~500 meters
 * for the same category that are not resolved/closed
 */
const findNearbyDuplicates = async ({ category, latitude, longitude, excludeId = null }) => {
    const query = {
        category,
        status: { $nin: ['resolved', 'closed', 'draft'] },
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: 500, // 500 meters
            },
        },
    };
    if (excludeId) query._id = { $ne: excludeId };

    const duplicates = await Complaint.find(query)
        .select('complaintId title status upvoteCount createdAt address')
        .limit(5)
        .lean();

    return duplicates;
};

/**
 * Check if a user recently submitted a very similar complaint (same category + within 2km in last 24h)
 */
const checkRecentUserDuplicate = async ({ userId, category, latitude, longitude }) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await Complaint.findOne({
        citizen: userId,
        category,
        createdAt: { $gte: oneDayAgo },
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: 2000, // 2km
            },
        },
    })
        .select('complaintId status')
        .lean();

    return duplicate;
};

module.exports = { findNearbyDuplicates, checkRecentUserDuplicate };
