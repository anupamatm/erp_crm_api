const Attendance = require('../../models/HR/Attendance');

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
