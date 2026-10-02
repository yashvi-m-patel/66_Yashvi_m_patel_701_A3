const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ store: new FileStore({ path: './sessions' }), secret: process.env.SESSION_SECRET || 'assignment-two-secret', resave: false, saveUninitialized: false, cookie: { maxAge: 60 * 60 * 1000 } }));
function protectedPage(req, res, next) { if (!req.session.user) return res.redirect('/'); next(); }
app.get('/', (req, res) => res.render('login', { error: '', user: req.session.user }));
app.post('/login', (req, res) => {
  if (req.body.username === 'student' && req.body.password === 'pass123') {
    req.session.user = req.body.username;
    return res.redirect('/profile');
  }
  res.status(401).render('login', { error: 'Wrong username or password.', user: null });
});
app.get('/profile', protectedPage, (req, res) => res.render('page', { title: 'Profile', user: req.session.user, text: 'This is the first protected route.' }));
app.get('/courses', protectedPage, (req, res) => res.render('page', { title: 'Courses', user: req.session.user, text: 'This is the second protected route.' }));
app.post('/logout', protectedPage, (req, res) => req.session.destroy(() => res.redirect('/')));
app.listen(3002, () => console.log('File session app: http://localhost:3002'));