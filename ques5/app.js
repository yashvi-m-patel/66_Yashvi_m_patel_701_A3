const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const Employee = mongoose.model('Employee', new mongoose.Schema({
  empId: String, name: String, email: String, department: String,
  basic: Number, allowance: Number, deduction: Number, salary: Number, password: String
}, { collection: 'employees' }));
const Leave = mongoose.model('Leave', new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  grant: { type: String, enum: ['Yes', 'No'], required: true }
}, { timestamps: true }));

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Login required.' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'employee-assignment-secret'); next(); }
  catch { res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
app.post('/api/login', async (req, res) => {
  const employee = await Employee.findOne({ empId: req.body.empId });
  if (!employee || !(await bcrypt.compare(req.body.password || '', employee.password))) return res.status(401).json({ message: 'Invalid employee ID or password.' });
  const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET || 'employee-assignment-secret', { expiresIn: '8h' });
  res.json({ token });
});
app.get('/api/profile', auth, async (req, res) => {
  const employee = await Employee.findById(req.user.id).select('-password');
  if (!employee) return res.sendStatus(404);
  res.json(employee);
});
app.get('/api/leaves', auth, async (req, res) => res.json(await Leave.find({ employee: req.user.id }).sort({ date: -1 })));
app.post('/api/leaves', auth, async (req, res) => {
  if (!req.body.date || !req.body.reason?.trim() || !['Yes', 'No'].includes(req.body.grant)) return res.status(400).json({ message: 'Date, reason, and grant choice are required.' });
  const leave = await Leave.create({ employee: req.user.id, date: req.body.date, reason: req.body.reason, grant: req.body.grant });
  res.status(201).json(leave);
});
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/erp_assignment')
  .then(() => app.listen(3005, () => console.log('Employee API: http://localhost:3005')))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });