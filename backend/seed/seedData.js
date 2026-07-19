require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');
};

const seed = async () => {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Existing data cleared.');

    // ─── Departments ───────────────────────────────────────────────
    const policeDept = await Department.create({
        name: 'City Police Department',
        type: 'police',
        description: 'Handles security and law enforcement complaints',
        contactEmail: 'police@enagar.gov.in',
        contactPhone: '9000100001',
        slaHours: { urgent: 4, high: 12, medium: 48, low: 120 },
    });

    const municipalDept = await Department.create({
        name: 'Municipal Corporation',
        type: 'municipal',
        description: 'Handles civic infrastructure complaints',
        contactEmail: 'municipal@enagar.gov.in',
        contactPhone: '9000100002',
        slaHours: { urgent: 8, high: 24, medium: 72, low: 168 },
    });

    console.log('Departments created.');

    // ─── Admin ─────────────────────────────────────────────────────
    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@enagar.gov.in',
        password: 'Admin@1234',
        role: 'admin',
        phone: '9000000001',
        isVerified: true,
    });

    // ─── Police Officer ────────────────────────────────────────────
    const policeOfficer = await User.create({
        name: 'Inspector Ramesh Kumar',
        email: 'police@enagar.gov.in',
        password: 'Police@1234',
        role: 'police',
        department: policeDept._id,
        phone: '9000000002',
        isVerified: true,
        createdBy: admin._id,
    });
    await Department.findByIdAndUpdate(policeDept._id, { $push: { officers: policeOfficer._id } });

    // ─── Municipal Officer ─────────────────────────────────────────
    const municipalOfficer = await User.create({
        name: 'Officer Priya Sharma',
        email: 'municipal@enagar.gov.in',
        password: 'Municipal@1234',
        role: 'municipal',
        department: municipalDept._id,
        phone: '9000000003',
        isVerified: true,
        createdBy: admin._id,
    });
    await Department.findByIdAndUpdate(municipalDept._id, { $push: { officers: municipalOfficer._id } });

    // ─── Citizens ──────────────────────────────────────────────────
    const citizen1 = await User.create({
        name: 'Rajesh Nair',
        email: 'citizen1@example.com',
        password: 'Citizen@1234',
        role: 'citizen',
        phone: '9876543210',
        address: '42 Gandhi Nagar, Hyderabad',
        isVerified: true,
        languagePreference: 'te',
    });

    const citizen2 = await User.create({
        name: 'Ananya Singh',
        email: 'citizen2@example.com',
        password: 'Citizen@1234',
        role: 'citizen',
        phone: '9876543211',
        address: '7 MG Road, Bangalore',
        isVerified: true,
        languagePreference: 'hi',
    });

    console.log('Users created.');

    // ─── Complaints ────────────────────────────────────────────────
    const now = new Date();
    const complaint1 = await Complaint.create({
        complaintId: 'ENS-2026-000001',
        citizen: citizen1._id,
        category: 'security',
        title: 'Suspicious activity near market area',
        description: 'There are unknown individuals loitering near the Gandhi Nagar Market late at night, causing fear among residents. This has been happening for the past week.',
        address: '42 Gandhi Nagar Market, Hyderabad',
        location: { type: 'Point', coordinates: [78.4867, 17.3850] },
        status: 'assigned',
        assignedDepartment: policeDept._id,
        assignedOfficer: policeOfficer._id,
        priority: 'urgent',
        slaDueAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        consentGiven: true,
        auditTrail: [
            { action: 'complaint_submitted', performedBy: citizen1._id, performedByName: 'Rajesh Nair', newStatus: 'submitted', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
            { action: 'complaint_assigned', performedBy: admin._id, performedByName: 'Admin User', newStatus: 'assigned', note: 'Assigned to Inspector Ramesh', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
        ],
    });

    const complaint2 = await Complaint.create({
        complaintId: 'ENS-2026-000002',
        citizen: citizen2._id,
        category: 'road_issue',
        title: 'Large pothole on MG Road causing accidents',
        description: 'There is a very large pothole near the MG Road flyover that has caused two bike accidents this week. The road surface is completely broken and needs immediate repair.',
        address: 'MG Road near Flyover, Bangalore',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        status: 'in_progress',
        assignedDepartment: municipalDept._id,
        assignedOfficer: municipalOfficer._id,
        priority: 'high',
        slaDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        consentGiven: true,
        auditTrail: [
            { action: 'complaint_submitted', performedBy: citizen2._id, performedByName: 'Ananya Singh', newStatus: 'submitted', timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
            { action: 'complaint_assigned', performedBy: admin._id, performedByName: 'Admin User', newStatus: 'assigned', timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
            { action: 'status_updated', performedBy: municipalOfficer._id, performedByName: 'Officer Priya Sharma', previousStatus: 'assigned', newStatus: 'in_progress', note: 'Repair crew dispatched', timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
        ],
        comments: [{
            author: municipalOfficer._id,
            text: 'Repair crew has been dispatched. Work expected to complete by tomorrow.',
            isInternal: false,
        }],
    });

    const complaint3 = await Complaint.create({
        complaintId: 'ENS-2026-000003',
        citizen: citizen1._id,
        category: 'garbage',
        title: 'Overflowing garbage bins in residential area',
        description: 'Garbage bins near Block 5, Gandhi Nagar have not been collected for 4 days. The area smells terrible and flies are breeding in the garbage, creating a health hazard.',
        address: 'Block 5, Gandhi Nagar, Hyderabad',
        location: { type: 'Point', coordinates: [78.4900, 17.3870] },
        status: 'resolved',
        assignedDepartment: municipalDept._id,
        assignedOfficer: municipalOfficer._id,
        priority: 'medium',
        slaDueAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        slaBreached: false,
        consentGiven: true,
        resolvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolutionProof: {
            images: [],
            note: 'Garbage cleared and area sanitized.',
            submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            submittedBy: municipalOfficer._id,
        },
        auditTrail: [
            { action: 'complaint_submitted', performedByName: 'Rajesh Nair', newStatus: 'submitted', timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
            { action: 'complaint_assigned', performedByName: 'Admin User', newStatus: 'assigned', timestamp: new Date(now.getTime() - 47 * 60 * 60 * 1000) },
            { action: 'resolution_proof_uploaded', performedByName: 'Officer Priya Sharma', newStatus: 'resolved', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        ],
    });

    const complaint4 = await Complaint.create({
        complaintId: 'ENS-2026-000004',
        citizen: citizen2._id,
        category: 'streetlight',
        title: 'Streetlights not working for 3 days',
        description: 'The entire stretch of 200 meters on Railway Station Road has no working streetlights. This is causing security concerns at night, especially for women.',
        address: 'Railway Station Road, Hyderabad',
        location: { type: 'Point', coordinates: [78.4947, 17.3753] },
        status: 'escalated',
        assignedDepartment: municipalDept._id,
        priority: 'medium',
        slaDueAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // overdue
        slaBreached: true,
        escalated: true,
        escalationLevel: 1,
        consentGiven: true,
        auditTrail: [
            { action: 'complaint_submitted', performedByName: 'Ananya Singh', newStatus: 'submitted', timestamp: new Date(now.getTime() - 96 * 60 * 60 * 1000) },
            { action: 'auto_escalated', performedByName: 'System', newStatus: 'escalated', note: 'Auto-escalated due to SLA breach', timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
        ],
    });

    console.log('Complaints created.');

    // ─── Notifications ─────────────────────────────────────────────
    await Notification.create([
        {
            recipient: citizen1._id,
            type: 'complaint_assigned',
            title: 'Complaint Assigned',
            message: 'Your complaint ENS-2026-000001 has been assigned to Inspector Ramesh Kumar.',
            relatedComplaint: complaint1._id,
            isRead: false,
        },
        {
            recipient: policeOfficer._id,
            type: 'officer_assigned',
            title: 'New Complaint Assigned',
            message: 'Complaint ENS-2026-000001 (Security) has been assigned to you.',
            relatedComplaint: complaint1._id,
            isRead: false,
        },
        {
            recipient: citizen2._id,
            type: 'status_changed',
            title: 'Complaint Status Updated',
            message: 'Your complaint ENS-2026-000002 is now in progress.',
            relatedComplaint: complaint2._id,
            isRead: true,
        },
        {
            recipient: admin._id,
            type: 'complaint_escalated',
            title: 'Complaint Escalated',
            message: 'Complaint ENS-2026-000004 has been auto-escalated due to SLA breach.',
            relatedComplaint: complaint4._id,
            isRead: false,
        },
        {
            recipient: citizen1._id,
            type: 'feedback_requested',
            title: 'Please Confirm Resolution',
            message: 'Your complaint ENS-2026-000003 has been resolved. Please confirm or reopen.',
            relatedComplaint: complaint3._id,
            isRead: false,
        },
    ]);

    console.log('Notifications created.');
    console.log('\n✅ Seeding complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  SAMPLE LOGIN CREDENTIALS');
    console.log('─────────────────────────────────────────');
    console.log('  Admin:            admin@enagar.gov.in     / Admin@1234');
    console.log('  Police Officer:   police@enagar.gov.in   / Police@1234');
    console.log('  Municipal Officer:municipal@enagar.gov.in/ Municipal@1234');
    console.log('  Citizen 1:        citizen1@example.com   / Citizen@1234');
    console.log('  Citizen 2:        citizen2@example.com   / Citizen@1234');
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
