const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'half-day', 'on-leave'], 
    default: 'absent' 
  },
  notes: String,
  totalHours: Number
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', attendanceSchema);