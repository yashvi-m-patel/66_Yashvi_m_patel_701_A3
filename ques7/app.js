const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const Category = mongoose.model('Category', new mongoose.Schema({ name: { type: String, required: true, trim: true }, parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null } }, { timestamps: true }));
const Product = mongoose.model('Product', new mongoose.Schema({ name: { type: String, required: true, trim: true }, description: { type: String, default: '' }, price: { type: Number, required: true, min: 0 }, stock: { type: Number, required: true, min: 0 }, category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true } }, { timestamps: true }));
const Order = mongoose.model('Order', new mongoose.Schema({ items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, quantity: Number, price: Number }], total: Number, createdAt: { type: Date, default: Date.now } }));
function adminOnly(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !jwt.verify(token, process.env.JWT_SECRET || 'shop-assignment-secret').admin) return res.status(401).json({ message: 'Admin login required.' });
    next();
  } catch { res.status(401).json({ message: 'Admin login required.' }); }
}
app.post('/api/admin/login', (req, res) => {
  if (req.body.username !== (process.env.ADMIN_USER || 'admin') || req.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) return res.status(401).json({ message: 'Incorrect admin login.' });
  res.json({ token: jwt.sign({ admin: true }, process.env.JWT_SECRET || 'shop-assignment-secret', { expiresIn: '8h' }) });
});
app.get('/api/categories', async (req, res) => res.json(await Category.find().populate('parent', 'name').sort({ name: 1 })));
app.post('/api/categories', adminOnly, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Category name is required.' });
  if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (!parent || parent.parent) return res.status(400).json({ message: 'Choose a top-level category as the parent.' });
  }
  res.status(201).json(await Category.create({ name, parent: req.body.parent || null }));
});
app.delete('/api/categories/:id', adminOnly, async (req, res) => {
  if (await Category.exists({ parent: req.params.id }) || await Product.exists({ category: req.params.id })) return res.status(400).json({ message: 'Remove its subcategories and products first.' });
  await Category.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});
app.get('/api/products', async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  res.json(await Product.find(filter).populate({ path: 'category', select: 'name parent', populate: { path: 'parent', select: 'name' } }).sort({ name: 1 }));
});
app.post('/api/products', adminOnly, async (req, res) => {
  try { res.status(201).json(await Product.create({ name: req.body.name, description: req.body.description, price: Number(req.body.price), stock: Number(req.body.stock), category: req.body.category })); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.put('/api/products/:id', adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description, price: Number(req.body.price), stock: Number(req.body.stock), category: req.body.category }, { new: true, runValidators: true }).populate('category', 'name parent');
    if (!product) return res.sendStatus(404);
    res.json(product);
  } catch (error) { res.status(400).json({ message: error.message }); }
});
app.delete('/api/products/:id', adminOnly, async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.sendStatus(204); });
app.post('/api/orders', async (req, res) => {
  try {
    if (!Array.isArray(req.body.items) || !req.body.items.length) return res.status(400).json({ message: 'Your cart is empty.' });
    const savedItems = [];
    let total = 0;
    for (const item of req.body.items) {
      const quantity = Math.floor(Number(item.quantity));
      const product = await Product.findById(item.productId);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || product.stock < quantity) return res.status(400).json({ message: 'A product is unavailable or has insufficient stock.' });
      product.stock -= quantity;
      await product.save();
      total += product.price * quantity;
      savedItems.push({ product: product._id, name: product.name, quantity, price: product.price });
    }
    const order = await Order.create({ items: savedItems, total });
    res.status(201).json({ orderId: order._id, total });
  } catch (error) { res.status(400).json({ message: error.message }); }
});
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/shop_assignment')
  .then(() => app.listen(3007, () => console.log('Shop API: http://localhost:3007')))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });