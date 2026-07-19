const Notification = require('../models/Notification');
const { emitToUser, emitToRole } = require('../config/socket');
const logger = require('../utils/logger');

/**
 * Create a notification and emit via socket
 */
const createNotification = async ({
    recipientId,
    type,
    title,
    message,
    relatedComplaint,
    relatedUser,
    metadata,
    emitToRoleGroup,
}) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            relatedComplaint,
            relatedUser,
            metadata,
        });

        const payload = {
            _id: notification._id,
            type,
            title,
            message,
            relatedComplaint,
            createdAt: notification.createdAt,
        };

        // Emit to specific user
        if (recipientId) emitToUser(recipientId.toString(), 'new_notification', payload);

        // Also emit to role group if needed (e.g., admin)
        if (emitToRoleGroup) emitToRole(emitToRoleGroup, 'new_notification', payload);

        return notification;
    } catch (err) {
        logger.error(`Failed to create notification: ${err.message}`);
    }
};

/**
 * Notify officer when complaint is assigned to them
 */
const notifyOfficerAssigned = async (officerId, complaint) => {
    await createNotification({
        recipientId: officerId,
        type: 'officer_assigned',
        title: 'New Complaint Assigned',
        message: `Complaint ${complaint.complaintId} (${complaint.category.replace('_', ' ')}) has been assigned to you.`,
        relatedComplaint: complaint._id,
    });
};

/**
 * Notify citizen about status change
 */
const notifyCitizenStatusChange = async (citizenId, complaint, newStatus) => {
    const statusLabels = {
        assigned: 'Assigned to an officer',
        in_progress: 'Under investigation',
        resolved: 'Resolved',
        closed: 'Closed',
        escalated: 'Escalated for priority review',
        reopened: 'Reopened',
    };

    await createNotification({
        recipientId: citizenId,
        type: 'status_changed',
        title: `Complaint ${complaint.complaintId} Status Updated`,
        message: `Status: ${statusLabels[newStatus] || newStatus}`,
        relatedComplaint: complaint._id,
    });
};

/**
 * Notify admin about escalation
 */
const notifyAdminEscalation = async (adminIds, complaint) => {
    for (const adminId of adminIds) {
        await createNotification({
            recipientId: adminId,
            type: 'complaint_escalated',
            title: 'Complaint Escalated',
            message: `Complaint ${complaint.complaintId} has been auto-escalated due to SLA breach.`,
            relatedComplaint: complaint._id,
            emitToRoleGroup: 'admin',
        });
    }
};

/**
 * Notify admins about SLA breach
 */
const notifySlaBreach = async (adminIds, complaint) => {
    for (const adminId of adminIds) {
        await createNotification({
            recipientId: adminId,
            type: 'sla_breach',
            title: 'SLA Breach Alert',
            message: `Complaint ${complaint.complaintId} has exceeded its SLA deadline.`,
            relatedComplaint: complaint._id,
        });
    }
};

module.exports = {
    createNotification,
    notifyOfficerAssigned,
    notifyCitizenStatusChange,
    notifyAdminEscalation,
    notifySlaBreach,
};
