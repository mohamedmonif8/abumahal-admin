import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(() => { const s = localStorage.getItem('abumahal_admin'); return s ? JSON.parse(s) : null; });
  const [view, setView] = useState('dashboard');
  const [phone, setPhone] = useState(''); const [password, setPassword] = useState('');
  
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://abumahal-backend.onrender.com';
  const colors = { primary: '#1A252C', accent: '#E52B20', bg: '#F4F7F6', card: '#FFFFFF', textDark: '#2C3E50', textGray: '#7F8C8D' };

  const showToast = (msg ) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchAllData = async () => {
    if (!user) return;
    try {
      const [resB, resC, resP, resO, resU] = await Promise.all([
        fetch(`${API_URL}/api/branches`), fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/products`), fetch(`${API_URL}/api/orders`), fetch(`${API_URL}/api/users`)
      ]);
      const [dB, dC, dP, dO, dU] = await Promise.all([resB.json(), resC.json(), resP.json(), resO.json(), resU.json()]);
      if(Array.isArray(dB)) setBranches(dB);
      if(Array.isArray(dC)) setCategories(dC);
      if(Array.isArray(dP)) setProducts(dP);
      if(Array.isArray(dO)) setOrders(dO.reverse());
      if(Array.isArray(dU)) setUsers(dU);
    } catch (err) { console.log("جاري تحديث البيانات..."); }
  };

  useEffect(() => { fetchAllData(); const int = setInterval(fetchAllData, 10000); return () => clearInterval(int); }, [user]);

  const handleLogin = (e) => {
    e.preventDefault(); setIsLoading(true);
    fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) })
    .then(res => res.json()).then(data => {
      setIsLoading(false);
      if (data.error) return showToast(data.error);
      if (data.role !== 'مدير') return showToast("عذراً، هذه اللوحة للمدراء فقط ⛔");
      localStorage.setItem('abumahal_admin', JSON.stringify(data));
      setUser(data); showToast(`أهلاً بك يا مدير ${data.name} 👑`);
    }).catch(() => { setIsLoading(false); showToast("خطأ في الاتصال"); });
  };

  const handleLogout = () => { localStorage.removeItem('abumahal_admin'); setUser(null); };

  const handleAdd = (endpoint, body, msg) => {
    fetch(`${API_URL}/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(()=> { showToast(msg); fetchAllData(); }).catch(()=>showToast("خطأ"));
  };

  const handleDelete = (endpoint, id, msg) => {
    if(!window.confirm('هل أنت متأكد من الحذف؟')) return;
    fetch(`${API_URL}/api/${endpoint}/${id}`, { method: 'DELETE' }).then(()=> { showToast(msg); fetchAllData(); }).catch(()=>showToast("خطأ"));
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: colors.bg, fontFamily: 'sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: '#333', color: 'white', padding: '15px', borderRadius: '10px', zIndex: 1000 }}>{toast}</div>}
        <div style={{ backgroundColor: colors.card, padding: '40px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <img src="/logo.png" alt="شعار" onError={(e) => e.target.style.display='none'} style={{ width: '100px', height: '100px', borderRadius: '20px', marginBottom: '15px', boxShadow: '0 5px 15px rgba(229,43,32,0.2)' }} />
          <h2 style={{ color: colors.primary, margin: '0 0 5px 0', fontWeight: '900' }}>الإدارة العليا</h2>
          <p style={{ color: colors.textGray, marginBottom: '30px' }}>تسجيل دخول المدراء فقط</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '16px', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '16px', outline: 'none' }} />
            <button type="submit" disabled={isLoading} style={{ padding: '15px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'جاري التحقق...' : 'دخول للإدارة'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', backgroundColor: colors.bg, fontFamily: 'sans-serif', display: 'flex' }}>
      <style>{`* { box-sizing: border-box; } .btn-scale:active { transform: scale(0.95); } .smooth-enter { animation: fadeIn 0.4s ease; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '12px 25px', borderRadius: '30px', zIndex: 1000, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>{toast}</div>}
      
      <div style={{ width: '250px', backgroundColor: colors.primary, color: 'white', padding: '20px 0', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 15px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', padding: '0 20px' }}>
          <img src="/logo.png" alt="شعار" onError={(e) => e.target.style.display='none'} style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'white', padding: '5px', marginBottom: '10px' }} />
          <h3 style={{ margin: 0 }}>أبو مهل</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>لوحة التحكم الرئيسية</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 15px', flex: 1 }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'نظرة عامة' },
            { id: 'branches', icon: '🏪', label: 'الفروع' },
            { id: 'categories', icon: '📁', label: 'الأقسام' },
            { id: 'products', icon: '🍔', label: 'المنتجات' },
            { id: 'users', icon: '👥', label: 'الموظفين' },
            { id: 'orders', icon: '🧾', label: 'كل الطلبات' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{ padding: '12px 15px', backgroundColor: view === tab.id ? colors.accent : 'transparent', color: 'white', border: 'none', borderRadius: '10px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', transition: '0.2s' }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ padding: '20px 15px' }}>
          <button onClick={handleLogout} className="btn-scale" style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>تسجيل الخروج</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h1 style={{ margin: 0, color: colors.textDark }}>{view === 'dashboard' ? 'نظرة عامة' : view === 'branches' ? 'إدارة الفروع' : view === 'categories' ? 'إدارة الأقسام' : view === 'products' ? 'إدارة المنتجات' : view === 'users' ? 'إدارة الموظفين' : 'سجل الطلبات'}</h1>
          <div style={{ fontWeight: 'bold', color: colors.textGray }}>مرحباً، {user.name} 👑</div>
        </div>

        {view === 'dashboard' && (
          <div className="smooth-enter" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { title: 'إجمالي الطلبات', count: orders.length, color: '#3498db', icon: '🧾' },
              { title: 'المنتجات', count: products.length, color: '#2ecc71', icon: '🍔' },
              { title: 'الفروع', count: branches.length, color: '#9b59b6', icon: '🏪' },
              { title: 'الموظفين والعملاء', count: users.length, color: '#f1c40f', icon: '👥' }
            ].map((stat, i) => (
              <div key={i} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: `4px solid ${stat.color}` }}>
                <div style={{ fontSize: '40px' }}>{stat.icon}</div>
                <div><h3 style={{ margin: '0 0 5px 0', color: colors.textGray }}>{stat.title}</h3><div style={{ fontSize: '28px', fontWeight: '900', color: colors.textDark }}>{stat.count}</div></div>
              </div>
            ))}
          </div>
        )}

        {view === 'branches' && (
          <div className="smooth-enter">
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>إضافة فرع جديد</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAdd('branches', { name: e.target.branchName.value }, 'تم إضافة الفرع'); e.target.reset(); }} style={{ display: 'flex', gap: '10px' }}>
                <input name="branchName" placeholder="اسم الفرع (مثال: المحالة)" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <button type="submit" style={{ padding: '12px 25px', backgroundColor: colors.accent, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة</button>
              </form>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {branches.map(b => (
                <div key={b.id} style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <strong style={{ fontSize: '16px' }}>📍 {b.name}</strong>
                  <button onClick={() => handleDelete('branches', b.id, 'تم حذف الفرع')} style={{ backgroundColor: '#ffeeee', color: '#e74c3c', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'categories' && (
          <div className="smooth-enter">
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>إضافة قسم جديد</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAdd('categories', { name: e.target.catName.value }, 'تم إضافة القسم'); e.target.reset(); }} style={{ display: 'flex', gap: '10px' }}>
                <input name="catName" placeholder="اسم القسم (مثال: مشويات)" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <button type="submit" style={{ padding: '12px 25px', backgroundColor: colors.accent, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة</button>
              </form>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {categories.map(c => (
                <div key={c.id} style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <strong style={{ fontSize: '16px' }}>📁 {c.name}</strong>
                  <button onClick={() => handleDelete('categories', c.id, 'تم حذف القسم')} style={{ backgroundColor: '#ffeeee', color: '#e74c3c', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'products' && (
          <div className="smooth-enter">
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>إضافة منتج جديد</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAdd('products', { name: e.target.pName.value, price: parseFloat(e.target.pPrice.value), categoryId: parseInt(e.target.pCat.value) }, 'تم إضافة المنتج'); e.target.reset(); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input name="pName" placeholder="اسم المنتج" required style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input name="pPrice" type="number" step="0.01" placeholder="السعر" required style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <select name="pCat" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <option value="">اختر القسم...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="submit" style={{ padding: '12px 25px', backgroundColor: colors.accent, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة</button>
              </form>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {products.map(p => (
                <div key={p.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', borderRight: `4px solid ${p.isAvailable ? '#27ae60' : '#e74c3c'}` }}>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{p.name}</strong>
                    <span style={{ color: colors.accent, fontWeight: 'bold' }}>{p.price} ريال</span>
                  </div>
                  <button onClick={() => handleDelete('products', p.id, 'تم حذف المنتج')} style={{ backgroundColor: '#ffeeee', color: '#e74c3c', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'users' && (
          <div className="smooth-enter">
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ marginTop: 0 }}>إضافة موظف / مدير جديد</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAdd('register', { name: e.target.uName.value, phone: e.target.uPhone.value, password: e.target.uPass.value, role: e.target.uRole.value, branch: e.target.uBranch.value || null }, 'تم إضافة المستخدم'); e.target.reset(); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input name="uName" placeholder="الاسم" required style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input name="uPhone" placeholder="رقم الجوال" required style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <input name="uPass" placeholder="الرقم السري" required style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                <select name="uRole" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <option value="موظف">موظف مطبخ</option>
                  <option value="مدير">مدير نظام</option>
                </select>
                <select name="uBranch" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <option value="">اختر الفرع (للموظفين)</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <button type="submit" style={{ padding: '12px 25px', backgroundColor: colors.accent, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة</button>
              </form>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {users.map(u => (
                <div key={u.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', borderRight: `4px solid ${u.role === 'مدير' ? '#9b59b6' : u.role === 'موظف' ? '#3498db' : '#95a5a6'}` }}>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{u.name}</strong>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '5px' }}>{u.phone} | <span style={{ fontWeight: 'bold', color: colors.textDark }}>{u.role}</span> {u.branch && `| فرع ${u.branch}`}</div>
                  </div>
                  {u.role !== 'مدير' && <button onClick={() => handleDelete('users', u.id, 'تم حذف المستخدم')} style={{ backgroundColor: '#ffeeee', color: '#e74c3c', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="smooth-enter">
            <div style={{ display: 'grid', gap: '15px' }}>
              {orders.length === 0 ? <p>لا توجد طلبات في النظام.</p> : orders.map(o => (
                <div key={o.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: `5px solid ${o.status === 'جاهز' ? '#27ae60' : o.status === 'جاري التجهيز' ? '#f39c12' : '#e74c3c'}` }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>طلب #{o.id} <span style={{ fontSize: '14px', color: '#777', fontWeight: 'normal' }}>({o.orderType})</span></h3>
                    <p style={{ margin: 0, color: colors.textGray }}>العميل: <strong>{o.customerName}</strong> | الفرع: <strong>{o.branch}</strong></p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: colors.textDark, marginBottom: '5px' }}>{o.totalPrice} ريال</div>
                    <span style={{ backgroundColor: '#f8f9fa', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
