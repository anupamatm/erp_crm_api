const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/hr/employeeController');
const leaveController = require('../controllers/hr/leaveController');
const attendanceController = require('../controllers/hr/attendanceController');
const departmentController = require('../controllers/hr/departmentController');
const payrollController = require('../controllers/hr/payrollController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Allowed roles
const hrRoles = ['admin', 'manager', 'hr'];

// Apply authentication and authorization to all HR routes
router.use(authenticate);
router.use(authorize(hrRoles));

/** Employee Routes */
// Basic employee list without any population
router.get('/employees/basic', employeeController.getBasicEmployeeList);

// Full employee details with populated fields
router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/stats', employeeController.getEmployeeStats);
router.get('/employees/:id', employeeController.getEmployeeById);
router.post('/employees', employeeController.createEmployee);
router.put('/employees/:id', employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);

/** Leave Routes */
router.get('/leaves', leaveController.getLeaveRequests);
router.get('/leaves/:id', leaveController.getLeaveRequest);
router.post('/leaves', leaveController.createLeaveRequest);
router.put('/leaves/:id', leaveController.updateLeaveRequest);
router.delete('/leaves/:id', leaveController.deleteLeaveRequest);
router.put('/leaves/approve/:id', leaveController.updateLeaveRequest);
router.put('/leaves/reject/:id', leaveController.updateLeaveRequest);

/** Attendance Routes */
router.get('/attendance', attendanceController.getAttendance);
router.get('/attendance/employee/:employeeId', attendanceController.getEmployeeAttendance);
router.post('/attendance', attendanceController.markAttendance);
router.put('/attendance/:id', attendanceController.updateAttendance);
router.delete('/attendance/:id', attendanceController.deleteAttendance);

/** Department Routes */
router.get('/departments', departmentController.getDepartments);
router.get('/departments/:id', departmentController.getDepartmentById);
router.post('/departments', departmentController.createDepartment);
router.put('/departments/:id', departmentController.updateDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

/** Payroll Routes */
router.get('/payroll', payrollController.getPayrollRecords);
router.post('/payroll/process', payrollController.processPayroll);

module.exports = router;
