const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

const app = express();
const Employee = mongoose.model('Employee', new mongoose.Schema({
  empId: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  department: { type: String, required: true, trim: true },
  basic: { type: Number, required: true, min: 0 },
  allowance: { type: Number, default: 0, min: 0 },
  deduction: { type: Number, default: 0, min: 0 },
  salary: { type: Number, required: true },
  password: { type: String, required: true }
}, { timestamps: true }));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET || 'erp-assignment-session', resave: false, saveUninitialized: false }));
function adminOnly(req, res, next) { if (!req.session.admin) return res.redirect('/'); next(); }
function newPassword() { return crypto.randomBytes(5).toString('hex'); }
function page(req, res, name, data = {}) { res.render(name, { admin: req.session.admin, ...data }); }

app.get('/', (req, res) => page(req, res, 'login', { error: '' }));
app.post('/login', (req, res) => {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if (req.body.username === username && req.body.password === password) {
    req.session.admin = username;
    return res.redirect('/employees');
  }
  res.status(401).render('login', { error: 'Incorrect admin username or password.' });
});
app.get('/employees', adminOnly, async (req, res) => page(req, res, 'employees', { employees: await Employee.find().sort({ createdAt: -1 }), message: req.query.message || '' }));
app.get('/employees/new', adminOnly, (req, res) => page(req, res, 'employee-form', { employee: {}, error: '' }));
app.post('/employees', adminOnly, async (req, res) => {
  try {
    const password = newPassword();
    const empId = `EMP${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const basic = Number(req.body.basic);
    const allowance = Number(req.body.allowance || 0);
    const deduction = Number(req.body.deduction || 0);
    const employee = await Employee.create({ empId, name: req.body.name, email: req.body.email, department: req.body.department, basic, allowance, deduction, salary: basic + allowance - deduction, password: await bcrypt.hash(password, 10) });
    let mailed = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const mailer = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      try {
        await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: employee.email, subject: 'Your employee account', text: `Employee ID: ${empId}\nTemporary password: ${password}` });
        mailed = true;
      } catch (error) { console.error('Employee email failed:', error.message); }
    } else {
      console.log(`Email not configured. Employee ${empId} password: ${password}`);
    }
    res.render('created', { employee, password, mailed });
  } catch (error) {
    res.status(400).render('employee-form', { admin: req.session.admin, employee: req.body, error: error.message });
  }
});
app.get('/employees/:id/edit', adminOnly, async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.sendStatus(404);
  page(req, res, 'employee-form', { employee, error: '' });
});
app.post('/employees/:id', adminOnly, async (req, res) => {
  try {
    const basic = Number(req.body.basic);
    const allowance = Number(req.body.allowance || 0);
    const deduction = Number(req.body.deduction || 0);
    await Employee.findByIdAndUpdate(req.params.id, { name: req.body.name, email: req.body.email, department: req.body.department, basic, allowance, deduction, salary: basic + allowance - deduction }, { runValidators: true });
    res.redirect('/employees?message=Employee%20updated');
  } catch (error) {
    res.status(400).render('employee-form', { admin: req.session.admin, employee: { ...req.body, _id: req.params.id }, error: error.message });
  }
});
app.post('/employees/:id/delete', adminOnly, async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect('/employees?message=Employee%20deleted');
});
app.post('/logout', adminOnly, (req, res) => req.session.destroy(() => res.redirect('/')));

mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/erp_assignment')
  .then(() => app.listen(3004, () => console.log('ERP admin: http://localhost:3004')))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });