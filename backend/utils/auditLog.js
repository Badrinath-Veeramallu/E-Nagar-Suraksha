const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const createAuditLog = async ({
    actor,
    actorName,
    actorRole,
    action,
    targetType,
    targetId,
    targetIdentifier,
    metadata,
    ipAddress,
    userAgent,
}) => {
    try {
        await AuditLog.create({
            actor,
            actorName,
            actorRole,
            action,
            targetType,
            targetId,
            targetIdentifier,
            metadata,
            ipAddress,
            userAgent,
        });
    } catch (err) {
        logger.error(`Failed to create audit log: ${err.message}`);
    }
};

/**
 * Helper to extract request context for audit logging
 */
const getRequestContext = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    actor: req.user?._id,
    actorName: req.user?.name,
    actorRole: req.user?.role,
});

module.exports = { createAuditLog, getRequestContext };
