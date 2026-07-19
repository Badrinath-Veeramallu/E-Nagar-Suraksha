const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const { generateComplaintId } = require('../utils/complaintId');
const { calculateSlaDueAt } = require('../utils/sla');
const { findNearbyDuplicates, checkRecentUserDuplicate } = require('../utils/duplicateDetect');
const { createAuditLog, getRequestContext } = require('../utils/auditLog');
const { notifyOfficerAssigned, notifyCitizenStatusChange, createNotification } = require('../services/notificationService');
const { emitToRole } = require('../config/socket');
const path = require('path');

// @desc   Check for duplicate nearby complaints
// @route  GET /api/complaints/duplicates/check
// @access Private (citizen)
const checkDuplicates = async (req, res, next) => {
    try {
        const { category, latitude, longitude } = req.query;
        if (!category || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'category, latitude, and longitude are required' });
        }
        const duplicates = await findNearbyDuplicates({
            category, latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        });
        res.json({ success: true, count: duplicates.length, data: duplicates });
    } catch (err) { next(err); }
};

// @desc   Create a new complaint
// @route  POST /api/complaints
// @access Private (citizen)
// Police (security) complaints don't need photos; all municipal ones do
const POLICE_CATEGORIES = ['security'];

// Valid status transitions — key: current status, value: allowed next statuses for officers
const ALLOWED_TRANSITIONS = {
    submitted: ['assigned', 'in_progress', 'resolved'],
    pending_review: ['assigned', 'in_progress'],
    assigned: ['in_progress', 'escalated', 'resolved'],
    in_progress: ['escalated', 'resolved'],
    escalated: ['in_progress', 'resolved'],
    resolved: ['closed'],   // closed only via citizen feedback
    reopened: ['assigned', 'in_progress', 'resolved'],
    closed: [],           // terminal — no further officer updates
};

const createComplaint = async (req, res, next) => {
    try {
        const { category, title, description, address, latitude, longitude, consentGiven } = req.body;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // ── Photo requirement: mandatory for all municipal (non-security) categories ──
        const isPoliceCategory = POLICE_CATEGORIES.includes(category);
        const uploadedImages = req.files || [];
        if (!isPoliceCategory && uploadedImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Photo is required for municipal complaints. Please upload at least one image.',
                errors: [{ field: 'images', message: 'Photo is required for municipal complaints.' }],
            });
        }

        // Check for recent user spam
        const userDup = await checkRecentUserDuplicate({ userId: req.user._id, category, latitude: lat, longitude: lng });
        if (userDup) {
            return res.status(429).json({
                success: false,
                message: `You already submitted a similar complaint recently (${userDup.complaintId}). Please check its status.`,
                existingComplaintId: userDup.complaintId,
            });
        }

        // Determine department & auto-assign
        const deptType = isPoliceCategory ? 'police' : 'municipal';
        const dept = await Department.findOne({ type: deptType, isActive: true });

        const { slaDueAt, priority } = calculateSlaDueAt(category);
        const complaintId = await generateComplaintId();

        const images = uploadedImages.map((f) => `/uploads/complaints/${f.filename}`);

        const complaint = await Complaint.create({
            complaintId,
            citizen: req.user._id,
            category,
            title,
            description,
            address,
            location: { type: 'Point', coordinates: [lng, lat] },
            images,
            status: 'submitted',
            assignedDepartment: dept ? dept._id : undefined,
            priority,
            slaDueAt,
            consentGiven: consentGiven === 'true' || consentGiven === true,
            auditTrail: [{
                action: 'complaint_submitted',
                performedBy: req.user._id,
                performedByName: req.user.name,
                newStatus: 'submitted',
                note: 'Complaint submitted by citizen',
                timestamp: new Date(),
            }],
        });

        // Notify admin about new complaint
        emitToRole('admin', 'new_complaint', { complaintId: complaint.complaintId, category, title });

        await createAuditLog({
            ...getRequestContext(req),
            action: 'complaint_created',
            targetType: 'Complaint',
            targetId: complaint._id,
            targetIdentifier: complaintId,
        });

        res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: { complaintId: complaint.complaintId, _id: complaint._id } });
    } catch (err) { next(err); }
};

// @desc   Get my complaints (citizen)
// @route  GET /api/complaints/my
// @access Private (citizen)
const getMyComplaints = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = { citizen: req.user._id };
        if (status) query.status = status;

        const complaints = await Complaint.find(query)
            .populate('assignedDepartment', 'name type')
            .populate('assignedOfficer', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-auditTrail -comments');

        const total = await Complaint.countDocuments(query);
        res.json({ success: true, count: complaints.length, total, data: complaints });
    } catch (err) { next(err); }
};

// @desc   Get all complaints (admin / officer)
// @route  GET /api/complaints/all
// @access Admin, Police, Municipal
const getAllComplaints = async (req, res, next) => {
    try {
        const { status, category, department, escalated, slaBreached, page = 1, limit = 20, search } = req.query;
        const query = {};

        // Officers only see their department's complaints
        if (req.user.role === 'police' || req.user.role === 'municipal') {
            if (!req.user.department) {
                // Officer has no department assigned — return empty list with helpful message
                return res.json({ success: true, count: 0, total: 0, page: parseInt(page), data: [], message: 'No department assigned to your account. Contact an administrator.' });
            }
            query.assignedDepartment = req.user.department;
        }

        if (status) query.status = status;
        if (category) query.category = category;
        if (department && req.user.role === 'admin') query.assignedDepartment = department;
        if (escalated !== undefined) query.escalated = escalated === 'true';
        if (slaBreached !== undefined) query.slaBreached = slaBreached === 'true';
        if (search) {
            query.$or = [
                { complaintId: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }

        const complaints = await Complaint.find(query)
            .populate('citizen', 'name email phone')
            .populate('assignedDepartment', 'name type')
            .populate('assignedOfficer', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-auditTrail -comments');

        const total = await Complaint.countDocuments(query);
        res.json({ success: true, count: complaints.length, total, page: parseInt(page), data: complaints });
    } catch (err) { next(err); }
};

// @desc   Get single complaint by ID
// @route  GET /api/complaints/:id
// @access Private
const getComplaintById = async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        const idParam = req.params.id;
        const isObjectId = mongoose.isValidObjectId(idParam);

        const complaint = await Complaint.findOne(
            isObjectId ? { $or: [{ _id: idParam }, { complaintId: idParam }] } : { complaintId: idParam }
        )
            .populate('citizen', 'name email phone')
            .populate('assignedDepartment', 'name type contactEmail')
            .populate('assignedOfficer', 'name email')
            .populate('comments.author', 'name role')
            .populate('auditTrail.performedBy', 'name role')
            .populate('resolutionProof.submittedBy', 'name role');

        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        // Citizens can only see their own
        if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
        }

        // Officers see only their department's
        if ((req.user.role === 'police' || req.user.role === 'municipal') &&
            complaint.assignedDepartment &&
            complaint.assignedDepartment._id.toString() !== req.user.department?.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
        }

        // Anonymize citizen info for officers (phone/email not exposed)
        let data = complaint.toObject();
        if (req.user.role !== 'admin' && req.user.role !== 'citizen') {
            if (data.citizen) { data.citizen = { _id: data.citizen._id, name: data.citizen.name }; }
        }

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// @desc   Search complaint by complaintId (public track)
// @route  GET /api/complaints/search
// @access Public
const searchComplaint = async (req, res, next) => {
    try {
        const { complaintId } = req.query;
        if (!complaintId) return res.status(400).json({ success: false, message: 'complaintId query param is required' });

        const complaint = await Complaint.findOne({ complaintId })
            .populate('assignedDepartment', 'name type')
            .select('complaintId title category status address priority slaDueAt slaBreached escalated createdAt updatedAt resolvedAt auditTrail');

        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found with this ID' });

        // Sanitize auditTrail — only show action, timestamp, note (no user refs)
        const sanitized = complaint.toObject();
        sanitized.auditTrail = sanitized.auditTrail.map(({ action, note, timestamp, newStatus }) => ({ action, note, timestamp, newStatus }));

        res.json({ success: true, data: sanitized });
    } catch (err) { next(err); }
};

// @desc   Update complaint status
// @route  PUT /api/complaints/:id/update-status
// @access Admin, Police, Municipal
const updateStatus = async (req, res, next) => {
    try {
        const { status, note } = req.body;
        const complaint = await Complaint.findOne({ _id: req.params.id });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const prevStatus = complaint.status;

        // ── Closed complaints cannot be updated by officers ──
        if (prevStatus === 'closed') {
            return res.status(400).json({ success: false, message: 'This complaint is closed and cannot be updated.' });
        }

        // ── Validate transition ──
        const allowed = ALLOWED_TRANSITIONS[prevStatus] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition: '${prevStatus}' → '${status}'. Allowed: ${allowed.join(', ') || 'none'}.`,
            });
        }

        // ── Municipal officers MUST use the proof-upload endpoint to resolve ──
        // Block any direct resolve attempt from municipal role — prevents API bypass
        if (req.user.role === 'municipal' && status === 'resolved') {
            return res.status(400).json({
                success: false,
                message: 'Municipal officers must submit resolution proof via POST /complaints/:id/proof. Direct resolve is not allowed.',
            });
        }

        complaint.status = status;

        // ── When resolved or closed: clear escalation and SLA breach flags ──
        if (status === 'resolved' || status === 'closed') {
            complaint.escalated = false;
            complaint.slaBreached = false;
            complaint.escalationLevel = 0;
            complaint.escalationNote = '';
        }
        if (status === 'resolved') complaint.resolvedAt = new Date();
        if (status === 'closed') complaint.closedAt = new Date();

        complaint.auditTrail.push({
            action: 'status_updated',
            performedBy: req.user._id,
            performedByName: req.user.name,
            previousStatus: prevStatus,
            newStatus: status,
            note: note || '',
            timestamp: new Date(),
        });

        await complaint.save();

        await notifyCitizenStatusChange(complaint.citizen, complaint, status);
        emitToRole('admin', 'complaint_updated', { complaintId: complaint.complaintId, status });

        await createAuditLog({
            ...getRequestContext(req),
            action: 'status_updated',
            targetType: 'Complaint',
            targetId: complaint._id,
            targetIdentifier: complaint.complaintId,
            metadata: { from: prevStatus, to: status },
        });

        res.json({ success: true, message: 'Status updated', data: { complaintId: complaint.complaintId, status } });
    } catch (err) { next(err); }
};

// @desc   Assign complaint to department/officer
// @route  POST /api/complaints/:id/assign
// @access Admin
const assignComplaint = async (req, res, next) => {
    try {
        const { departmentId, officerId } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (departmentId) {
            const dept = await Department.findById(departmentId);
            if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
            complaint.assignedDepartment = dept._id;
        }
        if (officerId) {
            const officer = await User.findById(officerId);
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });
            complaint.assignedOfficer = officer._id;
        }

        complaint.status = 'assigned';
        complaint.auditTrail.push({
            action: 'complaint_assigned',
            performedBy: req.user._id,
            performedByName: req.user.name,
            newStatus: 'assigned',
            note: `Assigned to ${officerId ? 'officer' : 'department'}`,
            timestamp: new Date(),
        });

        await complaint.save();
        if (officerId) await notifyOfficerAssigned(officerId, complaint);
        await notifyCitizenStatusChange(complaint.citizen, complaint, 'assigned');

        await createAuditLog({
            ...getRequestContext(req),
            action: 'complaint_assigned',
            targetType: 'Complaint',
            targetId: complaint._id,
            targetIdentifier: complaint.complaintId,
            metadata: { departmentId, officerId },
        });

        res.json({ success: true, message: 'Complaint assigned successfully' });
    } catch (err) { next(err); }
};

// @desc   Upload resolution proof
// @route  POST /api/complaints/:id/proof
// @access Police, Municipal
const uploadProof = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (complaint.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot upload proof for a closed complaint.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one proof image is required' });
        }

        const proofImages = req.files.map((f) => `/uploads/proofs/${f.filename}`);
        const prevStatus = complaint.status;

        complaint.resolutionProof = {
            images: proofImages,
            note: req.body.note || '',
            submittedAt: new Date(),
            submittedBy: req.user._id,
        };
        complaint.status = 'resolved';
        complaint.resolvedAt = new Date();
        // Clear escalation flags on resolution
        complaint.escalated = false;
        complaint.slaBreached = false;
        complaint.escalationLevel = 0;
        complaint.auditTrail.push({
            action: 'resolution_proof_uploaded',
            performedBy: req.user._id,
            performedByName: req.user.name,
            previousStatus: prevStatus,
            newStatus: 'resolved',
            note: 'Resolution proof uploaded',
            timestamp: new Date(),
        });

        await complaint.save();
        await notifyCitizenStatusChange(complaint.citizen, complaint, 'resolved');

        // Notify citizen to confirm resolution
        await createNotification({
            recipientId: complaint.citizen,
            type: 'feedback_requested',
            title: 'Please confirm complaint resolution',
            message: `Your complaint ${complaint.complaintId} has been marked resolved. Please confirm or reopen.`,
            relatedComplaint: complaint._id,
        });

        res.json({ success: true, message: 'Resolution proof submitted. Citizen notified for confirmation.' });
    } catch (err) { next(err); }
};

// @desc   Submit feedback (citizen)
// @route  POST /api/complaints/:id/feedback
// @access Private (citizen)
const submitFeedback = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (!['resolved', 'closed'].includes(complaint.status)) {
            return res.status(400).json({ success: false, message: 'Feedback can only be submitted after resolution' });
        }

        complaint.feedback = { rating, comment: comment || '', submittedAt: new Date() };
        complaint.citizenConfirmation = { confirmed: true, confirmedAt: new Date(), note: comment || '' };
        complaint.status = 'closed';
        complaint.closedAt = new Date();
        complaint.auditTrail.push({
            action: 'feedback_submitted',
            performedBy: req.user._id,
            performedByName: req.user.name,
            newStatus: 'closed',
            note: `Rating: ${rating}/5`,
            timestamp: new Date(),
        });

        await complaint.save();
        emitToRole('admin', 'feedback_received', { complaintId: complaint.complaintId, rating });

        res.json({ success: true, message: 'Feedback submitted. Complaint closed.' });
    } catch (err) { next(err); }
};

// @desc   Reopen complaint (citizen)
// @route  POST /api/complaints/:id/reopen
// @access Private (citizen)
const reopenComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (complaint.status !== 'resolved') {
            return res.status(400).json({ success: false, message: 'Only resolved complaints can be reopened' });
        }

        complaint.status = 'reopened';
        complaint.citizenConfirmation = { confirmed: false, confirmedAt: new Date(), note: req.body.reason || 'Not satisfied with resolution' };
        complaint.auditTrail.push({
            action: 'complaint_reopened',
            performedBy: req.user._id,
            performedByName: req.user.name,
            previousStatus: 'resolved',
            newStatus: 'reopened',
            note: req.body.reason || 'Citizen not satisfied',
            timestamp: new Date(),
        });

        await complaint.save();
        emitToRole('admin', 'complaint_reopened', { complaintId: complaint.complaintId });

        res.json({ success: true, message: 'Complaint reopened successfully' });
    } catch (err) { next(err); }
};

// @desc   Upvote a complaint
// @route  POST /api/complaints/:id/upvote
// @access Private (citizen)
const upvoteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const userId = req.user._id;
        const alreadyUpvoted = complaint.upvotes.includes(userId);

        if (alreadyUpvoted) {
            complaint.upvotes.pull(userId);
            complaint.upvoteCount = Math.max(0, complaint.upvoteCount - 1);
        } else {
            complaint.upvotes.push(userId);
            complaint.upvoteCount += 1;
        }

        await complaint.save();
        res.json({ success: true, upvoted: !alreadyUpvoted, upvoteCount: complaint.upvoteCount });
    } catch (err) { next(err); }
};

// @desc   Add comment
// @route  POST /api/complaints/:id/comment
// @access Private
const addComment = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        // Citizens can only comment on their own
        if (req.user.role === 'citizen' && complaint.citizen.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const isInternal = req.user.role !== 'citizen' && req.body.isInternal === true;

        complaint.comments.push({
            author: req.user._id,
            text: req.body.text,
            isInternal,
        });

        await complaint.save();
        res.json({ success: true, message: 'Comment added' });
    } catch (err) { next(err); }
};

module.exports = {
    createComplaint, getMyComplaints, getAllComplaints, getComplaintById,
    searchComplaint, updateStatus, assignComplaint, uploadProof,
    submitFeedback, reopenComplaint, upvoteComplaint, addComment, checkDuplicates,
};
