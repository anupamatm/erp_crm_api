// controllers/payrollController.js
const Employee = require('../../models/HR/Employee');

// Get payroll records
exports.getPayrollRecords = async (req, res) => {
  try {
    const { period } = req.query;
    const employees = await Employee.find({ status: 'active' })
      .populate('department', 'name')
      .select('firstName lastName employeeId salary');

    const payrollRecords = employees.map(emp => ({
      employeeId: emp._id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      basicSalary: emp.salary,
      allowances: Math.round(emp.salary * 0.1),
      deductions: Math.round(emp.salary * 0.15),
      netSalary: Math.round(emp.salary * 0.95),
      payPeriod: period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      status: 'pending'
    }));

    res.json(payrollRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process payroll
exports.processPayroll = async (req, res) => {
  try {
    const { employeeIds, period } = req.body;

    // In real world, handle processing, validation, saving, etc.
    res.json({
      message: 'Payroll processed successfully',
      processedCount: employeeIds.length,
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
