const Attendance = require('../../models/HR/Attendance');
const Employee = require('../../models/HR/Employee');
const mongoose = require('mongoose');

exports.getAttendance = async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    let query = {};

    if (date) query.date = new Date(date);
    if (employeeId) query.employee = employeeId;

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, type } = req.body;
    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: new Date(today),
    });

    if (type === 'in') {
      if (attendance) return res.status(400).json({ error: 'Already clocked in today' });

      attendance = new Attendance({
        employee: employeeId,
        date: new Date(today),
        clockIn: new Date().toLocaleTimeString('en-US', { hour12: false }),
      });
    } else if (type === 'out') {
      if (!attendance) return res.status(400).json({ error: 'No clock in record found' });
      if (attendance.clockOut) return res.status(400).json({ error: 'Already clocked out today' });

      const clockOut = new Date().toLocaleTimeString('en-US', { hour12: false });
      const clockInTime = new Date(`${today} ${attendance.clockIn}`);
      const clockOutTime = new Date(`${today} ${clockOut}`);
      const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);

      attendance.clockOut = clockOut;
      attendance.totalHours = parseFloat(totalHours.toFixed(2));
    }

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAttendance = async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');

    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const records = await Attendance.find({ employee: employeeId })
      .sort({ date: -1 })
      .populate('employee', 'firstName lastName employeeId');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 1);

    const summary = await Employee.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo',
        },
      },
      {
        $unwind: {
          path: '$departmentInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'attendances',
          let: { employee_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employee', '$$employee_id'] },
                    { $gte: ['$date', startDate] },
                    { $lt: ['$date', endDate] },
                  ],
                },
              },
            },
          ],
          as: 'attendanceRecord',
        },
      },
      {
        $unwind: {
          path: '$attendanceRecord',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          id: '$_id',
          firstName: 1,
          lastName: 1,
          email: 1,
          employeeId: 1,
          department: {
            $cond: {
              if: '$departmentInfo',
              then: {
                _id: '$departmentInfo._id',
                name: '$departmentInfo.name',
              },
              else: null,
            },
          },
          status: { $ifNull: ['$attendanceRecord.status', 'absent'] },
          checkIn: { $ifNull: ['$attendanceRecord.checkIn', null] },
          checkOut: { $ifNull: ['$attendanceRecord.checkOut', null] },
          workingHours: { $ifNull: ['$attendanceRecord.workingHours', null] },
          attendanceId: { $ifNull: ['$attendanceRecord._id', null] },
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error);
    res.status(500).json({ message: 'Failed to fetch attendance summary', error: error.message });
  }
};

exports.clockIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id }).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found for the logged-in user.' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todaysAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (todaysAttendance) {
      return res.status(400).json({ message: 'Already clocked in today.' });
    }

    const newAttendance = new Attendance({
      employee: employee._id,
      date: new Date(),
      checkIn: new Date(),
      status: 'present'
    });

    await newAttendance.save();
    res.status(201).json({ message: 'Clocked in successfully.', attendance: newAttendance });
  } catch (error) {
    console.error('Clock In Error:', error);
    res.status(500).json({ message: 'Server error during clock in.' });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id }).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Employee record not found for the logged-in user.' });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todaysAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (!todaysAttendance) {
      return res.status(400).json({ message: 'You have not clocked in today.' });
    }

    if (todaysAttendance.checkOut) {
      return res.status(400).json({ message: 'Already clocked out today.' });
    }

    todaysAttendance.checkOut = new Date();
    
    const checkInTime = new Date(todaysAttendance.checkIn).getTime();
    const checkOutTime = todaysAttendance.checkOut.getTime();
    const durationMs = checkOutTime - checkInTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    todaysAttendance.workingHours = `${hours}h ${minutes}m`;

    await todaysAttendance.save();
    res.status(200).json({ message: 'Clocked out successfully.', attendance: todaysAttendance });
  } catch (error) {
    console.error('Clock Out Error:', error);
    res.status(500).json({ message: 'Server error during clock out.' });
  }
};
