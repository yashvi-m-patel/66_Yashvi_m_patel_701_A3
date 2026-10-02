import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const blank = { name: '', email: '', course: '', age: '' };
function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
  async function loadStudents() { setStudents(await api('/api/students')); }
  useEffect(() => { loadStudents().catch((err) => setError(err.message)); }, []);
  async function saveStudent(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await api(editing ? `/api/students/${editing}` : '/api/students', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, age: Number(form.age) }) });
      setForm(blank); setEditing(''); setMessage(editing ? 'Student updated.' : 'Student added.'); await loadStudents();
    } catch (err) { setError(err.message); }
  }
  function editStudent(student) { setEditing(student.id); setForm({ name: student.name, email: student.email, course: student.course, age: student.age }); setError(''); setMessage(''); }
  async function deleteStudent(id) {
    if (!window.confirm('Delete this student?')) return;
    try { await api(`/api/students/${id}`, { method: 'DELETE' }); setMessage('Student deleted.'); await loadStudents(); }
    catch (err) { setError(err.message); }
  }
  return <main><header><p className="tag">STUDENT RECORDS</p><h1>Student Management</h1><p>Sequelize and SQLite</p></header><div className="content"><section className="form-panel"><h2>{editing ? 'Edit student' : 'Add student'}</h2><form onSubmit={saveStudent}><label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Course<input value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} required /></label><label>Age<input type="number" min="1" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} required /></label><div><button>{editing ? 'Update student' : 'Add student'}</button>{editing && <button type="button" className="cancel" onClick={() => { setEditing(''); setForm(blank); }}>Cancel</button>}</div></form></section><section className="records"><div className="list-heading"><h2>Students</h2><span>{students.length} records</span></div>{error && <p className="error">{error}</p>}{message && <p className="message">{message}</p>}{students.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Course</th><th>Age</th><th>Actions</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.name}</td><td>{student.email}</td><td>{student.course}</td><td>{student.age}</td><td><button className="edit" onClick={() => editStudent(student)}>Edit</button><button className="delete" onClick={() => deleteStudent(student.id)}>Delete</button></td></tr>)}</tbody></table></div> : <p className="empty">No student records yet.</p>}</section></div></main>;
}
createRoot(document.getElementById('root')).render(<App />);