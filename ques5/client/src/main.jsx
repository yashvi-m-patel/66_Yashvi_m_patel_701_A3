import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('employeeToken') || '');
  const [page, setPage] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');
  const [login, setLogin] = useState({ empId: '', password: '' });
  const [leave, setLeave] = useState({ date: '', reason: '', grant: 'No' });
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
  useEffect(() => {
    if (!token) return;
    request('/api/profile').then(setProfile).catch((err) => setError(err.message));
  }, [token]);
  useEffect(() => {
    if (token && page === 'leave') request('/api/leaves').then(setLeaves).catch((err) => setError(err.message));
  }, [token, page]);
  async function signIn(event) {
    event.preventDefault(); setError('');
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('employeeToken', data.token); setToken(data.token);
    } catch (err) { setError(err.message); }
  }
  async function addLeave(event) {
    event.preventDefault(); setError('');
    try { await request('/api/leaves', { method: 'POST', body: JSON.stringify(leave) }); setLeave({ date: '', reason: '', grant: 'No' }); setLeaves(await request('/api/leaves')); }
    catch (err) { setError(err.message); }
  }
  function signOut() { localStorage.removeItem('employeeToken'); setToken(''); setProfile(null); }
  if (!token) return <main className="login"><h1>Employee Portal</h1><form onSubmit={signIn}><label>Employee ID<input value={login.empId} onChange={(e) => setLogin({ ...login, empId: e.target.value })} required /></label><label>Password<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required /></label><button>Login</button>{error && <p className="error">{error}</p>}</form></main>;
  return <main><header><h1>Employee Portal</h1><button className="plain" onClick={signOut}>Logout</button></header><nav><button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')}>Page 1: Profile</button><button className={page === 'leave' ? 'active' : ''} onClick={() => setPage('leave')}>Page 2: Leave</button></nav>{error && <p className="error">{error}</p>}
    {page === 'profile' && profile && <section><h2>Employee Profile</h2><table><tbody>{[['Employee ID', profile.empId], ['Name', profile.name], ['Email', profile.email], ['Department', profile.department], ['Salary', profile.salary]].map(([key, value]) => <tr key={key}><th>{key}</th><td>{value}</td></tr>)}</tbody></table></section>}
    {page === 'leave' && <section><h2>Apply for leave</h2><form className="leave-form" onSubmit={addLeave}><label>Date<input type="date" value={leave.date} onChange={(e) => setLeave({ ...leave, date: e.target.value })} required /></label><label>Reason<textarea value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} required /></label><label>Grant<select value={leave.grant} onChange={(e) => setLeave({ ...leave, grant: e.target.value })}><option>No</option><option>Yes</option></select></label><button>Add application</button></form><h2>Leave applications</h2><table><thead><tr><th>Date</th><th>Reason</th><th>Grant</th></tr></thead><tbody>{leaves.map((item) => <tr key={item._id}><td>{new Date(item.date).toLocaleDateString()}</td><td>{item.reason}</td><td>{item.grant}</td></tr>)}</tbody></table></section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);