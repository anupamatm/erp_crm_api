// controllers/employeeController.js
const Employee = require('../../models/HR/Employee');

exports.getAllEmployees = async (req, res) => {
  try {
    // First, check if manager field exists in the schema
    const employeeSchema = Employee.schema.obj;
    const hasManagerField = 'manager' in employeeSchema;
    
    let query = Employee.find();
    
    // Only populate department if it exists in the schema
    if ('department' in employeeSchema) {
      query = query.populate('department', 'name');
    }
    
    // Only populate manager if it exists in the schema
    if (hasManagerField) {
      query = query.populate('manager', 'firstName lastName');
    }
    
    const employees = await query.sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
  }
};

// Add this route to get basic employee list without any population
exports.getBasicEmployeeList = async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-__v -createdAt -updatedAt')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error in getBasicEmployeeList:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employee list',
      details: error.message 
    });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .populate('manager', 'firstName lastName');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const onLeave = await Employee.countDocuments({ status: 'on_leave' });
    const departments = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      { $project: { _id: 0, name: '$department.name', count: 1 } }
    ]);

    res.json({
      total: totalEmployees,
      active: activeEmployees,
      onLeave,
      departments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let employeeId = 'EMP001';
    if (lastEmployee) {
      const lastId = parseInt(lastEmployee.employeeId.replace('EMP', ''));
      employeeId = `EMP${String(lastId + 1).padStart(3, '0')}`;
    }
    const employee = new Employee({ ...req.body, employeeId });
    await employee.save();
    await employee.populate('department', 'name');
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name').populate('manager', 'firstName lastName');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
