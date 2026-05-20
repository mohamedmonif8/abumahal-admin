import { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('users');
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);

  const colors = { primary: '#8b0000', accent: '#f1c40f', bg: '#f4f7f6', card: '#ffffff', textDark: '#2c3e50', textGray: '#7f8c8d' };
  const API_URL = 'https://abumahal-backend.onrender.com'; // الرابط الجديد للسيرفر

  const showToast = (msg ) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = () => {
    fetch(`${API_URL}/api/orders`).then(res => res.json()).then(data => { if(Array.isArray(data)) setOrders(data.reverse()); }).catch(()=>{});
    fetch(`${API_URL}/api/categories`).then(res => res.json()).then(data => { if(Array.isArray(data)) setCategories(data); }).catch(()=>{});
    fetch(`${API_URL}/api/products`).then(res => res.json()).then(data => { if(Array.isArray(data)) setProducts(data); }).catch(()=>{});
    fetch(`${API_URL}/api/branches`).then(res => res.json()).then(data => { if(Array.isArray(data)) setBranches(data); }).catch(()=>{});
    fetch(`${API_URL}/api/users`).then(res => res.json()).then(data => { if(Array.isArray(data)) setUsers(data.reverse()); }).catch(()=>{});
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 5000); return () => clearInterval(interval); }, []);

  const addCategory = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/categories`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: e.target.catName.value }) })
    .then(() => { fetchData(); showToast('تم إضافة القسم ✅'); e.target.reset(); });
  };

  const addProduct = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/products`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: e.target.prodName.value, price: parseFloat(e.target.prodPrice.value), categoryId: parseInt(e.target.catId.value) }) })
    .then(() => { fetchData(); showToast('تم إضافة المنتج 🍔'); e.target.reset(); });
  };

  const addBranch = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/branches`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: e.target.branchName.value }) })
    .then(() => { fetchData(); showToast('تم إضافة الفرع 🏪'); e.target.reset(); });
  };

  const addUser = (e) => {
    e.preventDefault();
    const data = {
      name: e.target.empName.value,
      phone: e.target.empPhone.value,
      password: e.target.empPassword.value,
      role: e.target.empRole.value,
      branch: e.target.empBranch.value || null
    };
    fetch(`${API_URL}/api/users`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) })
    .then(res => res.json())
    .then(resData => { 
      if(resData.error) return showToast(resData.error);
      fetchData(); showToast('تم إضافة الموظف بنجاح 👨‍💼'); e.target.reset(); 
    });
  };

  const deleteItem = (type, id) => {
    if(!window.confirm('هل أنت متأكد من الحذف؟')) return;
    fetch(`${API_URL}/api/${type}/${id}`, { method: 'DELETE' }).then(() => { fetchData(); showToast('تم الحذف 🗑️'); });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap' );
        * { font-family: 'Tajawal', sans-serif; box-sizing: border-box; }
        body { margin: 0; background-color: ${colors.bg}; color: ${colors.textDark}; }
        .glass-sidebar { background: linear-gradient(180deg, ${colors.primary} 0%, #4a0000 100%); color: white; }
        .nav-btn { width: 100%; text-align: right; padding: 15px; background: transparent; border: none; color: rgba(255,255,255,0.7); font-size: 16px; font-weight: bold; cursor: pointer; border-radius: 10px; margin-bottom: 5px; }
        .nav-btn.active { background: rgba(255,255,255,0.2); color: ${colors.accent}; border-right: 4px solid ${colors.accent}; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03); margin-bottom: 20px; }
        .input-style { width: 100%; padding: 12px; margin-bottom: 10px; border: 1px solid #eee; border-radius: 8px; font-size: 14px; background: #f9f9f9; outline: none; }
        .btn-submit { background: ${colors.primary}; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .btn-delete { background: #ffeeee; color: #e74c3c; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${colors.textDark}; color: white; padding: 15px 30px; border-radius: 30px; font-weight: bold; z-index: 1000; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
      `}</style>

      <div dir="rtl" style={{ display: 'flex', minHeight: '100vh' }}>
        {toast && <div className="toast">{toast}</div>}

        <div className="glass-sidebar" style={{ width: '260px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img src="/logo.png" alt="شعار" onError={(e) => e.target.style.display='none'} style={{ width: '80px', height: '80px', backgroundColor: 'white', borderRadius: '50%', padding: '5px', marginBottom: '10px' }} />
            <h2 style={{ margin: 0, color: 'white' }}>إدارة أبو مهل</h2>
          </div>
          <div style={{ flex: 1 }}>
            <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🧾 الطلبات</button>
            <button className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>📁 الأقسام</button>
            <button className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>🍔 المنتجات</button>
            <button className={`nav-btn ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>🏪 الفروع</button>
            <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 الموظفين</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ color: colors.primary }}>مراقبة الطلبات</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {orders.map(o => (
                  <div key={o.id} className="card" style={{ borderTop: `4px solid ${o.status === 'جاهز' ? '#27ae60' : colors.primary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>طلب #{o.id}</strong>
                      <span style={{ color: colors.primary, fontWeight: 'bold' }}>{o.totalPrice} ريال</span>
                    </div>
                    <p>العميل: {o.customerName} | الفرع: {o.branch}</p>
                    <div style={{ padding: '8px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: o.status === 'جاهز' ? '#27ae60' : colors.primary }}>{o.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <h2 style={{ color: colors.primary }}>الأقسام</h2>
              <div className="card">
                <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px' }}>
                  <input name="catName" placeholder="اسم القسم" required className="input-style" style={{ flex: 1, marginBottom: 0 }} />
                  <button type="submit" className="btn-submit">إضافة</button>
                </form>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {categories.map(c => (
                  <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                    <strong>{c.name}</strong>
                    <button className="btn-delete" onClick={() => deleteItem('categories', c.id)}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 style={{ color: colors.primary }}>المنتجات</h2>
              <div className="card">
                <form onSubmit={addProduct} style={{ display: 'flex', gap: '10px' }}>
                  <input name="prodName" placeholder="اسم المنتج" required className="input-style" style={{ flex: 2, marginBottom: 0 }} />
                  <input name="prodPrice" type="number" step="0.01" placeholder="السعر" required className="input-style" style={{ flex: 1, marginBottom: 0 }} />
                  <select name="catId" required className="input-style" style={{ flex: 1, marginBottom: 0 }}>
                    <option value="">القسم...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="submit" className="btn-submit">إضافة</button>
                </form>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {products.map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                    <div><strong>{p.name}</strong> <span style={{ color: colors.primary }}>({p.price} ريال)</span></div>
                    <button className="btn-delete" onClick={() => deleteItem('products', p.id)}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div>
              <h2 style={{ color: colors.primary }}>الفروع</h2>
              <div className="card">
                <form onSubmit={addBranch} style={{ display: 'flex', gap: '10px' }}>
                  <input name="branchName" placeholder="اسم الفرع" required className="input-style" style={{ flex: 1, marginBottom: 0 }} />
                  <button type="submit" className="btn-submit">إضافة</button>
                </form>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {branches.map(b => (
                  <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                    <strong>📍 {b.name}</strong>
                    <button className="btn-delete" onClick={() => deleteItem('branches', b.id)}>حذف</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 style={{ color: colors.primary }}>إدارة الموظفين والصلاحيات</h2>
              <div className="card">
                <form onSubmit={addUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <input name="empName" placeholder="اسم الموظف" required className="input-style" />
                  <input name="empPhone" placeholder="رقم الجوال (للدخول)" required className="input-style" />
                  <input name="empPassword" placeholder="الرقم السري" required className="input-style" />
                  <select name="empRole" required className="input-style">
                    <option value="موظف">موظف (مطبخ)</option>
                    <option value="مدير">مدير (إدارة)</option>
                  </select>
                  <select name="empBranch" className="input-style">
                    <option value="">بدون فرع (للمدير)</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                  <button type="submit" className="btn-submit">إضافة موظف</button>
                </form>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                  <thead style={{ background: '#f9f9f9' }}>
                    <tr><th>الاسم</th><th>الجوال</th><th>الصلاحية</th><th>الفرع</th><th>إجراء</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td dir="ltr">{u.phone}</td>
                        <td><span style={{ background: u.role === 'مدير' ? '#fdedec' : '#fef5e7', color: u.role === 'مدير' ? colors.primary : '#f39c12', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{u.role}</span></td>
                        <td>{u.branch || '---'}</td>
                        <td><button className="btn-delete" onClick={() => deleteItem('users', u.id)}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default App;
