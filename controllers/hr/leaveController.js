// controllers/leaveController.js
const LeaveRequest = require('../../models/HR/LeaveRequest');

// Get all leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;

    const leaves = await LeaveRequest.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ appliedDate: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single leave request by ID
exports.getLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');
      
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const leave = new LeaveRequest(req.body);
    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId');
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update leave request (approve/reject)
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { status, approvedBy, comments } = req.body;

    const updateData = { status, comments };
    if (status === 'approved' || status === 'rejected') {
      updateData.approvedBy = approvedBy;
      updateData.approvedDate = new Date();
    }

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete leave request
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
