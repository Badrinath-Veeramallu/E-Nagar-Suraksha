const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        type: {
            type: String,
            enum: ['police', 'municipal', 'admin'],
            required: true,
        },
        description: { type: String, trim: true, maxlength: 500 },
        contactEmail: { type: String, lowercase: true, trim: true },
        contactPhone: { type: String, trim: true },
        officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
        slaHours: {
            urgent: { type: Number, default: 4 },
            high: { type: Number, default: 24 },
            medium: { type: Number, default: 72 },
            low: { type: Number, default: 168 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
