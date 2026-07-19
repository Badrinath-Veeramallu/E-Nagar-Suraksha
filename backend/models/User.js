const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        clerkId: { type: String, sparse: true, index: true }, // Clerk user ID for social/SSO auth
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email'],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please use a valid 10-digit Indian phone number'],
        },
        password: { type: String, minlength: 8, select: false },
        role: {
            type: String,
            enum: ['citizen', 'police', 'municipal', 'admin'],
            default: 'citizen',
        },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        station: { type: String, trim: true, maxlength: 150 },      // Police station / municipal ward
        designation: { type: String, trim: true, maxlength: 100 }, // Job title / rank
        isBlocked: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        emailVerified: { type: Boolean, default: false },
        languagePreference: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
        profileImage: { type: String },
        address: { type: String, trim: true, maxlength: 300 },
        lastLogin: { type: Date },
        passwordChangedAt: { type: Date },
        resetPasswordToken: { type: String, select: false },
        resetPasswordExpire: { type: Date, select: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    if (this.isModified('password') && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Filter out deleted users by default
userSchema.pre(/^find/, function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

module.exports = mongoose.model('User', userSchema);
