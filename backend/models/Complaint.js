const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, maxlength: 1000, trim: true },
        isInternal: { type: Boolean, default: false }, // internal officer notes
    },
    { timestamps: true }
);

const auditEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: { type: String },
        previousStatus: { type: String },
        newStatus: { type: String },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
    }
);

const complaintSchema = new mongoose.Schema(
    {
        complaintId: { type: String, unique: true },
        citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        category: {
            type: String,
            enum: [
                'road_issue', 'garbage', 'water_supply', 'streetlight',
                'security', 'drainage', 'noise', 'electrical', 'sanitation', 'other',
            ],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, required: true, trim: true, maxlength: 2000 },
        address: { type: String, required: true, trim: true, maxlength: 500 },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true,
            },
        },
        images: [{ type: String }],
        status: {
            type: String,
            enum: [
                'draft', 'submitted', 'pending_review', 'assigned',
                'in_progress', 'escalated', 'resolved', 'reopened', 'closed',
            ],
            default: 'submitted',
        },
        assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        priority: {
            type: String,
            enum: ['urgent', 'high', 'medium', 'low'],
            default: 'medium',
        },
        slaDueAt: { type: Date },
        slaBreached: { type: Boolean, default: false },
        escalated: { type: Boolean, default: false },
        escalationLevel: { type: Number, default: 0 },
        escalationNote: { type: String },
        comments: [commentSchema],
        resolutionProof: {
            images: [{ type: String }],
            note: { type: String },
            submittedAt: { type: Date },
            submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
        citizenConfirmation: {
            confirmed: { type: Boolean, default: null },
            confirmedAt: { type: Date },
            note: { type: String },
        },
        feedback: {
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String, maxlength: 500 },
            submittedAt: { type: Date },
        },
        duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
        upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        upvoteCount: { type: Number, default: 0 },
        consentGiven: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        auditTrail: [auditEntrySchema],
        resolvedAt: { type: Date },
        closedAt: { type: Date },
    },
    { timestamps: true }
);

// Geospatial index for duplicate detection
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ citizen: 1, status: 1 });
complaintSchema.index({ assignedDepartment: 1, status: 1 });
complaintSchema.index({ assignedOfficer: 1, status: 1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

// Filter deleted complaints by default
complaintSchema.pre(/^find/, function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
