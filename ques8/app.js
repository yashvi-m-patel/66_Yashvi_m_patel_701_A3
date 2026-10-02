const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const sequelize = new Sequelize({ dialect: 'sqlite', storage: path.join(__dirname, 'students.sqlite'), logging: false });
const Student = sequelize.define('Student', {
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  course: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
  age: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 120 } }
});
app.use(express.json());
app.get('/api/students', async (req, res) => res.json(await Student.findAll({ order: [['id', 'DESC']] })));
app.post('/api/students', async (req, res) => {
  try { res.status(201).json(await Student.create(req.body)); }
  catch (error) { res.status(400).json({ message: error.errors?.[0]?.message || error.message }); }
});
app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.sendStatus(404);
    await student.update(req.body);
    res.json(student);
  } catch (error) { res.status(400).json({ message: error.errors?.[0]?.message || error.message }); }
});
app.delete('/api/students/:id', async (req, res) => {
  const deleted = await Student.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.sendStatus(404);
  res.sendStatus(204);
});
sequelize.sync()
  .then(() => app.listen(3008, () => console.log('Student API: http://localhost:3008')))
  .catch((error) => { console.error('Database start failed:', error.message); process.exit(1); });