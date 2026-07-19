const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { notifyAdminEscalation, notifySlaBreach } = require('./notificationService');
const { createAuditLog } = require('../utils/auditLog');
const logger = require('../utils/logger');

/**
 * Auto-escalate complaints that have breached SLA and are not yet resolved
 */
const runEscalationCheck = async () => {
    try {
        const now = new Date();

        // Find overdue, unresolved complaints not yet escalated
        const overdueComplaints = await Complaint.find({
            slaDueAt: { $lt: now },
            slaBreached: false,
            status: { $nin: ['resolved', 'closed', 'draft'] },
        }).select('_id complaintId citizen assignedOfficer status slaDueAt escalated');

        if (overdueComplaints.length === 0) return;

        // Get all admins for notifications
        const admins = await User.find({ role: 'admin', isBlocked: false }).select('_id').lean();
        const adminIds = admins.map((a) => a._id);

        for (const complaint of overdueComplaints) {
            // Mark SLA breached
            complaint.slaBreached = true;
            await Complaint.updateOne(
                { _id: complaint._id },
                { slaBreached: true }
            );
            await notifySlaBreach(adminIds, complaint);
            logger.info(`SLA breached for complaint ${complaint.complaintId}`);
        }

        // Find already-breached complaints for escalation (not yet escalated)
        const toEscalate = await Complaint.find({
            slaBreached: true,
            escalated: false,
            status: { $nin: ['resolved', 'closed', 'draft'] },
        }).select('_id complaintId citizen assignedOfficer status slaDueAt escalationLevel');

        for (const complaint of toEscalate) {
            await Complaint.updateOne(
                { _id: complaint._id },
                {
                    escalated: true,
                    status: 'escalated',
                    escalationLevel: 1,
                    $push: {
                        auditTrail: {
                            action: 'auto_escalated',
                            performedByName: 'System',
                            note: 'Auto-escalated due to SLA breach',
                            timestamp: now,
                            newStatus: 'escalated',
                        },
                    },
                }
            );

            await notifyAdminEscalation(adminIds, complaint);
            await createAuditLog({
                actorName: 'System',
                actorRole: 'system',
                action: 'complaint_auto_escalated',
                targetType: 'Complaint',
                targetId: complaint._id,
                targetIdentifier: complaint.complaintId,
                metadata: { reason: 'SLA breach auto-escalation' },
            });
            logger.warn(`Auto-escalated complaint ${complaint.complaintId}`);
        }
    } catch (err) {
        logger.error(`Escalation job error: ${err.message}`);
    }
};

/**
 * Start the cron job — runs every 30 minutes
 */
const startEscalationJob = () => {
    cron.schedule('*/30 * * * *', async () => {
        logger.info('Running escalation job...');
        await runEscalationCheck();
    });
    logger.info('Escalation cron job started (every 30 minutes)');
};

module.exports = { startEscalationJob, runEscalationCheck };
