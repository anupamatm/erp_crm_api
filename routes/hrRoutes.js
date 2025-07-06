const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/hr/employeeController');
const leaveController = require('../controllers/hr/leaveController');
const attendanceController = require('../controllers/hr/attendanceController');
const departmentController = require('../controllers/hr/departmentController');
const payrollController = require('../controllers/hr/payrollController');
const performanceController = require('../controllers/hr/performanceController');
const recruitmentController = require('../controllers/hr/recruitmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Define roles
const hrRoles = ['admin', 'manager', 'hr'];
const allRoles = ['admin', 'manager', 'hr', 'employee', 'sales', 'accounts'];

// Apply authentication to all HR routes
router.use(authenticate);

/** Employee Routes */
router.get('/employees/basic', authorize(hrRoles), employeeController.getBasicEmployeeList);
router.get('/employees', authorize(hrRoles), employeeController.getAllEmployees);
router.get('/employees/stats', authorize(hrRoles), employeeController.getEmployeeStats);
router.get('/employees/:id', authorize(hrRoles), employeeController.getEmployeeById);
router.post('/employees', authorize(hrRoles), employeeController.createEmployee);
router.put('/employees/:id', authorize(hrRoles), employeeController.updateEmployee);
router.delete('/employees/:id', authorize(hrRoles), employeeController.deleteEmployee);

/** Leave Routes */
router.get('/leaves', authorize(allRoles), leaveController.getLeaveRequests);
router.get('/leaves/:id', authorize(allRoles), leaveController.getLeaveRequest);
router.post('/leaves', authorize(allRoles), leaveController.createLeaveRequest);
router.put('/leaves/:id', authorize(hrRoles), leaveController.updateLeaveRequest);
router.delete('/leaves/:id', authorize(hrRoles), leaveController.deleteLeaveRequest);
router.put('/leaves/approve/:id', authorize(hrRoles), leaveController.updateLeaveRequest);
router.put('/leaves/reject/:id', authorize(hrRoles), leaveController.updateLeaveRequest);

/** Attendance Routes */
router.get('/attendance', authorize(hrRoles), attendanceController.getAttendance);
router.get('/attendance/summary', authorize(hrRoles), attendanceController.getAttendanceSummary);
router.post('/attendance/clockin', authorize(allRoles), attendanceController.clockIn);
router.post('/attendance/clockout', authorize(allRoles), attendanceController.clockOut);
router.post('/attendance', authorize(hrRoles), attendanceController.markAttendance);
router.get('/attendance/:employeeId', authorize(allRoles), attendanceController.getEmployeeAttendance);
router.delete('/attendance/:id', authorize(hrRoles), attendanceController.deleteAttendance);

/** Department Routes */
router.get('/departments', authorize(allRoles), departmentController.getDepartments);
router.get('/departments/:id', authorize(allRoles), departmentController.getDepartmentById);
router.post('/departments', authorize(hrRoles), departmentController.createDepartment);
router.put('/departments/:id', authorize(hrRoles), departmentController.updateDepartment);
router.delete('/departments/:id', authorize(hrRoles), departmentController.deleteDepartment);

/** Payroll Routes */
router.get('/payroll', authorize(hrRoles), payrollController.getPayrollRecords);
router.post('/payroll/process', authorize(hrRoles), payrollController.processPayroll);
router.get('/payroll/export', authorize(hrRoles), payrollController.exportPayroll);
router.get('/payroll/payslip/:id', authorize(allRoles), payrollController.getPaySlip);

/** Performance Routes */
router.get('/performance', authorize(hrRoles), performanceController.getPerformanceReviews);
router.get('/performance/:id', authorize(hrRoles), performanceController.getPerformanceReviewById);
router.post('/performance', authorize(hrRoles), performanceController.createPerformanceReview);
router.put('/performance/:id', authorize(hrRoles), performanceController.updatePerformanceReview);
router.delete('/performance/:id', authorize(hrRoles), performanceController.deletePerformanceReview);

/** Recruitment Routes */
router.get('/recruitment/openings', authorize(hrRoles), recruitmentController.getJobOpenings);
router.get('/recruitment/openings/:id', authorize(hrRoles), recruitmentController.getJobOpeningById);
router.post('/recruitment/openings', authorize(hrRoles), recruitmentController.createJobOpening);
router.put('/recruitment/openings/:id', authorize(hrRoles), recruitmentController.updateJobOpening);
router.delete('/recruitment/openings/:id', authorize(hrRoles), recruitmentController.deleteJobOpening);

module.exports = router;
