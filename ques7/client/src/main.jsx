import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './student.css';

function App() {
  const [view, setView] = useState('shop');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('shopCart') || '[]'));
  const [filter, setFilter] = useState('');
  const [token, setToken] = useState(localStorage.getItem('shopAdminToken') || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', parent: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', category: '' });
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
  async function loadData() {
    const [categoryList, productList] = await Promise.all([api('/api/categories'), api('/api/products')]);
    setCategories(categoryList); setProducts(productList);
  }
  useEffect(() => { loadData().catch((err) => setError(err.message)); }, []);
  useEffect(() => { localStorage.setItem('shopCart', JSON.stringify(cart)); }, [cart]);
  const filteredProducts = products.filter((item) => !filter || item.category?._id === filter || item.category?.parent === filter || item.category?.parent?._id === filter);
  function addToCart(product) {
    setCart((items) => {
      const found = items.find((item) => item._id === product._id);
      if (found) return items.map((item) => item._id === product._id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart.`);
  }
  function changeQuantity(id, quantity) { setCart((items) => items.map((item) => item._id === id ? { ...item, quantity: Math.max(1, Math.min(Number(quantity), item.stock)) } : item)); }
  async function checkout() {
    setError(''); setMessage('');
    try { const result = await api('/api/orders', { method: 'POST', body: JSON.stringify({ items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })) }) }); setCart([]); setMessage(`Order ${result.orderId} placed. Total: Rs. ${result.total.toFixed(2)}`); await loadData(); }
    catch (err) { setError(err.message); }
  }
  async function login(event) {
    event.preventDefault();
    try { const result = await api('/api/admin/login', { method: 'POST', body: JSON.stringify(credentials) }); localStorage.setItem('shopAdminToken', result.token); setToken(result.token); setError(''); }
    catch (err) { setError(err.message); }
  }
  async function addCategory(event) {
    event.preventDefault();
    try { await api('/api/categories', { method: 'POST', body: JSON.stringify(categoryForm) }); setCategoryForm({ name: '', parent: '' }); await loadData(); }
    catch (err) { setError(err.message); }
  }
  async function deleteCategory(id) {
    try { await api(`/api/categories/${id}`, { method: 'DELETE' }); await loadData(); }
    catch (err) { setError(err.message); }
  }
  async function saveProduct(event) {
    event.preventDefault();
    try {
      await api(productForm._id ? `/api/products/${productForm._id}` : '/api/products', { method: productForm._id ? 'PUT' : 'POST', body: JSON.stringify(productForm) });
      setProductForm({ name: '', description: '', price: '', stock: '', category: '' }); await loadData();
    } catch (err) { setError(err.message); }
  }
  async function deleteProduct(id) {
    try { await api(`/api/products/${id}`, { method: 'DELETE' }); await loadData(); }
    catch (err) { setError(err.message); }
  }
  function logoutAdmin() { localStorage.removeItem('shopAdminToken'); setToken(''); }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <main><header><div><p className="tag">ASSIGNMENT 7</p><h1>Simple Shop</h1></div><nav><button className={view === 'shop' ? 'chosen' : ''} onClick={() => setView('shop')}>Shop ({cart.length})</button><button className={view === 'admin' ? 'chosen' : ''} onClick={() => setView('admin')}>Admin</button></nav></header>{error && <p className="error">{error}</p>}{message && <p className="message">{message}</p>}
    {view === 'shop' && <div className="layout"><section><div className="section-head"><h2>Products</h2><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.parent ? `${item.parent.name} / ` : ''}{item.name}</option>)}</select></div><div className="products">{filteredProducts.map((item) => <article key={item._id}><p className="category">{item.category?.parent?.name ? `${item.category.parent.name} / ` : ''}{item.category?.name}</p><h3>{item.name}</h3><p>{item.description}</p><div className="product-bottom"><strong>Rs. {item.price.toFixed(2)}</strong><span>{item.stock} in stock</span></div><button disabled={!item.stock} onClick={() => addToCart(item)}>Add to cart</button></article>)}</div></section><aside><h2>Cart</h2>{cart.map((item) => <div className="cart-line" key={item._id}><div><strong>{item.name}</strong><small>Rs. {(item.price * item.quantity).toFixed(2)}</small></div><input aria-label={`Quantity for ${item.name}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => changeQuantity(item._id, event.target.value)} /><button className="remove" onClick={() => setCart((items) => items.filter((entry) => entry._id !== item._id))}>Remove</button></div>)}{!cart.length && <p>Your cart is empty.</p>}<p className="total">Total <strong>Rs. {total.toFixed(2)}</strong></p><button disabled={!cart.length} onClick={checkout}>Place order</button></aside></div>}
    {view === 'admin' && !token && <section className="admin-login"><h2>Admin login</h2><form onSubmit={login}><label>Username<input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label><button>Login</button></form><p>Default: admin / admin123</p></section>}
    {view === 'admin' && token && <section className="admin"><div className="section-head"><h2>Admin</h2><button className="remove" onClick={logoutAdmin}>Logout</button></div><div className="admin-grid"><form onSubmit={addCategory}><h3>Add category</h3><label>Name<input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required /></label><label>Parent category<select value={categoryForm.parent} onChange={(event) => setCategoryForm({ ...categoryForm, parent: event.target.value })}><option value="">Top-level category</option>{categories.filter((item) => !item.parent).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label><button>Add category</button></form><form onSubmit={saveProduct}><h3>{productForm._id ? 'Edit product' : 'Add product'}</h3><label>Name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label><label>Description<input value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label><label>Price<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required /></label><label>Stock<input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required /></label><label>Category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} required><option value="">Choose category</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.parent ? `${item.parent.name} / ` : ''}{item.name}</option>)}</select></label><button>Save product</button>{productForm._id && <button type="button" className="remove" onClick={() => setProductForm({ name: '', description: '', price: '', stock: '', category: '' })}>Cancel edit</button>}</form></div><h3>Categories</h3><ul className="manage-list">{categories.map((item) => <li key={item._id}>{item.parent ? `${item.parent.name} / ` : ''}{item.name}<button className="remove" onClick={() => deleteCategory(item._id)}>Delete</button></li>)}</ul><h3>Products</h3><ul className="manage-list">{products.map((item) => <li key={item._id}>{item.name} · ${item.price.toFixed(2)}<span><button onClick={() => setProductForm({ ...item, category: item.category?._id || '' })}>Edit</button><button className="remove" onClick={() => deleteProduct(item._id)}>Delete</button></span></li>)}</ul></section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);