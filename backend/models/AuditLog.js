const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorName: { type: String },
        actorRole: { type: String },
        action: { type: String, required: true },
        targetType: { type: String, enum: ['User', 'Complaint', 'Department', 'Notification', 'System'] },
        targetId: { type: mongoose.Schema.Types.ObjectId },
        targetIdentifier: { type: String }, // complaint ID or email for readability
        metadata: { type: mongoose.Schema.Types.Mixed },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
