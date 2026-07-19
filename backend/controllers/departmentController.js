const Department = require('../models/Department');
const User = require('../models/User');

// @desc   Get all departments
// @route  GET /api/departments
// @access Private
const getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find()
            .populate('officers', 'name email role')
            .sort({ name: 1 });
        res.json({ success: true, count: departments.length, data: departments });
    } catch (err) { next(err); }
};

// @desc   Create department
// @route  POST /api/departments
// @access Admin
const createDepartment = async (req, res, next) => {
    try {
        const { name, type, description, contactEmail, contactPhone, slaHours } = req.body;
        const dept = await Department.create({ name, type, description, contactEmail, contactPhone, slaHours });
        res.status(201).json({ success: true, message: 'Department created', data: dept });
    } catch (err) { next(err); }
};

// @desc   Update department
// @route  PUT /api/departments/:id
// @access Admin
const updateDepartment = async (req, res, next) => {
    try {
        const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
        res.json({ success: true, data: dept });
    } catch (err) { next(err); }
};

// @desc   Delete department
// @route  DELETE /api/departments/:id
// @access Admin
const deleteDepartment = async (req, res, next) => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
        dept.isActive = false;
        await dept.save();
        res.json({ success: true, message: 'Department deactivated' });
    } catch (err) { next(err); }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
