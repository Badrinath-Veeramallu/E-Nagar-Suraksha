const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: [
                'complaint_submitted', 'complaint_assigned', 'status_changed',
                'complaint_escalated', 'complaint_resolved', 'complaint_reopened',
                'feedback_requested', 'feedback_received', 'officer_assigned',
                'sla_breach', 'system',
            ],
            required: true,
        },
        title: { type: String, required: true, maxlength: 200 },
        message: { type: String, required: true, maxlength: 500 },
        relatedComplaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
        relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
