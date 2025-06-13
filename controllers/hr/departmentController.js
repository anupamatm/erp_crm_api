const Department = require('../../models/HR/Department');
const Employee = require('../../models/HR/Employee');

exports.getDepartments = async (req, res) => {
  try {
    console.log('Fetching departments...');
    
    // First get all departments
    const departments = await Department.find()
      .populate('manager', 'firstName lastName')
      .sort({ name: 1 })
      .lean(); // Convert to plain JS objects

    console.log(`Found ${departments.length} departments`);
    
    // Get employee counts for each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        try {
          const employeeCount = await Employee.countDocuments({ department: dept._id });
          return {
            ...dept,
            employeeCount,
            id: dept._id, // Add id field for frontend compatibility
          };
        } catch (err) {
          console.error(`Error counting employees for department ${dept._id}:`, err);
          return {
            ...dept,
            employeeCount: 0,
            id: dept._id,
            error: 'Failed to load employee count'
          };
        }
      })
    );

    console.log('Departments with counts:', departmentsWithCount);
    res.json(departmentsWithCount);
  } catch (error) {
    console.error('Error in getDepartments:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to fetch departments',
      details: error.message 
    });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('head', 'firstName lastName');
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    console.log('Creating department with data:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.code) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Name and code are required fields',
        received: req.body
      });
    }

    // Check if department with same name or code already exists
    const existingDept = await Department.findOne({
      $or: [
        { name: req.body.name },
        { code: req.body.code }
      ]
    });

    if (existingDept) {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'Department with this name or code already exists',
        existingDepartment: existingDept
      });
    }

    const department = new Department({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description || '',
      status: 'active',
      manager: req.body.manager || null
    });

    await department.save();
    console.log('Department created successfully:', department);
    
    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.message,
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create department',
      details: error.message 
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('head', 'firstName lastName');

    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
