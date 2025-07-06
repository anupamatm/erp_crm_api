const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

departmentSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

departmentSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Department', departmentSchema);