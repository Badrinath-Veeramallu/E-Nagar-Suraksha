const Complaint = require('../models/Complaint');

/**
 * Generate unique complaint ID like ENS-2026-000124
 */
const generateComplaintId = async () => {
    const year = new Date().getFullYear();
    const prefix = `ENS-${year}-`;

    // Find the latest complaint for this year
    const lastComplaint = await Complaint.findOne(
        { complaintId: { $regex: `^${prefix}` } },
        { complaintId: 1 }
    ).sort({ complaintId: -1 }).lean();

    let nextNumber = 1;
    if (lastComplaint) {
        const lastNum = parseInt(lastComplaint.complaintId.split('-')[2], 10);
        nextNumber = lastNum + 1;
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
};

module.exports = { generateComplaintId };
