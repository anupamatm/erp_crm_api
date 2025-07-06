const Employee = require('../../models/HR/Employee');
const Payroll = require('../../models/HR/Payroll');

// Get or Generate Payroll Records for a specific period
exports.getPayrollRecords = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    let payrollRecords = await Payroll.find({ month: currentMonth, year: currentYear })
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId email department position',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    if (payrollRecords.length === 0) {
      const activeEmployees = await Employee.find({ status: 'active' }).select('_id firstName lastName salary');
      
      if (activeEmployees.length === 0) {
        return res.json([]);
      }

      const newPayrollRecords = activeEmployees.map(emp => {
        const basicSalary = emp.salary || 0;
        const allowances = [{ name: 'Standard Allowance', amount: basicSalary * 0.1 }];
        const deductions = [{ name: 'Standard Deduction', amount: basicSalary * 0.05 }];
        const totalAllowances = allowances.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
        const netSalary = basicSalary + totalAllowances - totalDeductions;

        return {
          employee: emp._id,
          month: currentMonth,
          year: currentYear,
          basicSalary,
          allowances,
          deductions,
          netSalary,
          paymentDate: new Date(currentYear, currentMonth, 0),
          paymentMethod: 'bank_transfer',
          status: 'draft',
        };
      });

      await Payroll.insertMany(newPayrollRecords);
      payrollRecords = await Payroll.find({ month: currentMonth, year: currentYear })
        .populate({
          path: 'employee',
          select: 'firstName lastName employeeId email department position',
          populate: {
            path: 'department',
            select: 'name'
          }
        });
    }

    const formattedRecords = payrollRecords.map(p => ({
      _id: p._id,
      employeeId: p.employee?._id,
      employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'N/A',
      department: p.employee?.department?.name || 'N/A',
      payPeriod: `${new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`,
      basicSalary: p.basicSalary,
      netSalary: p.netSalary,
      status: p.status,
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error('Error in getPayrollRecords:', error);
    res.status(500).json({ error: 'Failed to get payroll records', details: error.message });
  }
};

// Process payroll for selected employees
exports.processPayroll = async (req, res) => {
  try {
    const { payrollIds, status } = req.body;

    if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
      return res.status(400).json({ error: 'Payroll IDs are required' });
    }
    if (!status || !['pending', 'processed', 'paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
    }

    const updateData = {
      status: status,
      processedBy: req.user._id
    };

    if (status === 'paid') {
      updateData.paymentDate = new Date();
    }

    const result = await Payroll.updateMany(
      { _id: { $in: payrollIds } },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
        return res.status(404).json({ message: 'No matching payroll records found or status already updated.' });
    }

    res.json({
      message: `Successfully updated ${result.modifiedCount} payroll records to ${status}.`,
      processedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in processPayroll:', error);
    res.status(500).json({ error: 'Failed to process payroll', details: error.message });
  }
};

// Export payroll data to CSV
exports.exportPayroll = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required for export.' });
        }

        const records = await Payroll.find({ month: parseInt(month), year: parseInt(year) })
            .populate('employee', 'firstName lastName employeeId');

        if (records.length === 0) {
            return res.status(404).json({ message: 'No payroll records found for the specified period.' });
        }

        const fields = ['Employee ID', 'Employee Name', 'Month', 'Year', 'Basic Salary', 'Net Salary', 'Status'];
        const csvData = records.map(r => [
            r.employee.employeeId,
            `"${r.employee.firstName} ${r.employee.lastName}"`,
            r.month,
            r.year,
            r.basicSalary,
            r.netSalary,
            r.status
        ].join(','));

        const csv = [fields.join(','), ...csvData].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment(`payroll-${month}-${year}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting payroll:', error);
        res.status(500).json({ error: 'Failed to export payroll data' });
    }
};

// Get a single payslip by ID
exports.getPaySlip = async (req, res) => {
    try {
        const { id } = req.params;
        const payslip = await Payroll.findById(id)
            .populate({
                path: 'employee',
                select: 'firstName lastName employeeId email department position dateOfJoining',
                populate: {
                    path: 'department',
                    select: 'name'
                }
            })
            .populate('processedBy', 'firstName lastName');

        if (!payslip) {
            return res.status(404).json({ message: 'Payslip not found.' });
        }

        res.json(payslip);
    } catch (error) {
        console.error('Error fetching payslip:', error);
        res.status(500).json({ error: 'Failed to fetch payslip data' });
    }
};
