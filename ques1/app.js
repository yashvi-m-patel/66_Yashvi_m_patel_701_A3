const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const imageExtensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif' };
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, done) => done(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${imageExtensions[file.mimetype] || ''}`)
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, done) => {
    if (imageExtensions[file.mimetype]) return done(null, true);
    done(new Error('Upload a JPEG, PNG, GIF, WebP, or AVIF image'));
  }
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.get('/', (req, res) => res.render('form', { values: {}, errors: [], uploadError: null }));
app.post('/register', upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'otherPics', maxCount: 5 }
]), [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3 to 30 characters.'),
  body('password').isLength({ min: 6 }).withMessage('Password must have at least 6 characters.'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Choose a gender.'),
  body('hobbies').custom((value) => value && (Array.isArray(value) ? value.length : 1)).withMessage('Choose at least one hobby.'),
  body('profilePic').custom((value, { req }) => Boolean(req.files.profilePic?.length)).withMessage('Upload a profile picture.')
], (req, res) => {
  const errors = validationResult(req);
  const values = { ...req.body, hobbies: Array.isArray(req.body.hobbies) ? req.body.hobbies : req.body.hobbies ? [req.body.hobbies] : [] };
  if (errors.isEmpty()) {
    return res.render('result', { values, profilePic: (req.files.profilePic || [])[0], otherPics: req.files.otherPics || [] });
  }
  res.render('form', { values, errors: errors.array(), uploadError: null });
});
app.get('/download/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(uploadDir, name);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  res.download(filePath, name);
});
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === 'Only image files are allowed') {
    return res.status(400).render('form', { values: req.body, errors: [], uploadError: error.message });
  }
  next(error);
});
app.listen(3001, () => console.log('Registration app: http://localhost:3001'));