import { useState, useEffect, useCallback } from 'react';

function App() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')) || null; } 
    catch (e) { return null; }
  });

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  // إعدادات التطبيقات (مؤقتاً تحفظ في المتصفح حتى نحدث السيرفر)
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('app_settings')) || { appName: 'مطعم أبو مهل', logoUrl: '', welcomeMsg: 'أهلاً بك في مطعمنا' }; }
    catch (e) { return { appName: 'مطعم أبو مهل', logoUrl: '', welcomeMsg: 'أهلاً بك في مطعمنا' }; }
  });

  const API_URL = 'https://abumahal-backend.onrender.com';

  const theme = {
    primary: '#1a252f', secondary: '#e31837', bg: '#f4f7f6', card: '#ffffff', 
    text: '#2c3e50', gray: '#95a5a6', success: '#27ae60', warning: '#f39c12'
  };

  useEffect(( ) => {
    if (admin) localStorage.setItem('admin_user', JSON.stringify(admin));
    else localStorage.removeItem('admin_user');
  }, [admin]);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!admin) return;
    try {
      const [usersRes, branchesRes, catsRes, prodsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/users`), fetch(`${API_URL}/api/branches`),
        fetch(`${API_URL}/api/categories`), fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/orders`)
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(Array.isArray(d) ? d.reverse() : []);
      }
    } catch (error) { console.error("Fetch error:", error); }
  }, [admin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.error) return showToast(data.error);
      if (data.role !== 'مدير') return showToast("عذراً، هذه البوابة للمدراء فقط!");
      
      setAdmin(data); showToast(`أهلاً بك يا ${data.name}`);
    } catch (error) { showToast("خطأ في الاتصال بالخادم"); }
  };

  // إضافة موظف جديد
  const addEmployee = async () => {
    const name = prompt("اسم الموظف:");
    const empPhone = prompt("رقم جوال الموظف:");
    const empPass = prompt("الرقم السري للموظف:");
    const branch = prompt(`اختر الفرع:\n${branches.map(b => b.name).join(' | ')}`);
    
    if (!name || !empPhone || !empPass || !branch) return showToast("يجب إدخال جميع البيانات");
    
    try {
      await fetch(`${API_URL}/api/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: empPhone, password: empPass, role: 'موظف', branch })
      });
      fetchData(); showToast("تمت إضافة الموظف بنجاح");
    } catch (e) { showToast("حدث خطأ"); }
  };

  // إضافة منتج مع صورة
  const addProduct = async () => {
    if (categories.length === 0) return showToast("الرجاء إضافة قسم أولاً!");
    const name = prompt("اسم المنتج:");
    const price = prompt("السعر:");
    const imageUrl = prompt("رابط صورة المنتج (اختياري):") || "";
    const categoryId = prompt(`أدخل رقم القسم:\n${categories.map(c => `${c.id}: ${c.name}`).join('\n')}`);
    
    if (!name || !price || !categoryId) return;
    try {
      // ملاحظة: السيرفر الحالي لا يحفظ imageUrl، سنقوم بتحديثه في الخطوة القادمة
      await fetch(`${API_URL}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name, price: parseFloat(price), categoryId: parseInt(categoryId), imageUrl })
      });
      fetchData(); showToast("تمت إضافة المنتج بنجاح");
    } catch (e) { showToast("حدث خطأ"); }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await fetch(`${API_URL}/api/${type}/${id}`, { method: 'DELETE' });
      fetchData(); showToast("تم الحذف بنجاح");
    } catch (e) { showToast("حدث خطأ أثناء الحذف"); }
  };

  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.primary, fontFamily: 'sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: theme.secondary, color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 9999 }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', fontSize: '50px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: theme.primary, textAlign: 'center', marginBottom: '30px' }}>نظام الإدارة الشامل</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <button type="submit" style={{ padding: '15px', border: 'none', borderRadius: '8px', backgroundColor: theme.secondary, color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>دخول الإدارة</button>
          </form>
        </div>
      </div>
    );
  }

  const totalRevenue = (orders || []).filter(o => o.status === 'مكتمل').reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px 30px', borderRadius: '30px', zIndex: 1000 }}>{toast}</div>}
      
      {/* القائمة الجانبية */}
      <div style={{ width: '260px', backgroundColor: theme.primary, color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #34495e', paddingBottom: '20px', marginBottom: '20px' }}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} /> : <div style={{ fontSize: '40px' }}>🏢</div>}
          <h3 style={{ margin: 0 }}>{settings.appName}</h3>
          <span style={{ fontSize: '12px', color: theme.gray }}>لوحة التحكم الرئيسية</span>
        </div>
        
        {[
          { id: 'dashboard', name: '📊 الإحصائيات' },
          { id: 'orders', name: '🧾 الطلبات الحية' },
          { id: 'users', name: '👥 الموظفين والعملاء' },
          { id: 'branches', name: '🏪 إدارة الفروع' },
          { id: 'menu', name: '🍔 المنتجات والصور' },
          { id: 'settings', name: '⚙️ إعدادات التطبيقات' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '15px', backgroundColor: activeTab === tab.id ? theme.secondary : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'right', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
            {tab.name}
          </button>
        ))}
        
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setAdmin(null)} style={{ width: '100%', padding: '15px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تسجيل الخروج</button>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>نظرة عامة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.secondary}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي المبيعات</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0', color: theme.text }}>{totalRevenue} ريال</p>
              </div>
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.success}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي الطلبات</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0', color: theme.text }}>{(orders || []).length}</p>
              </div>
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.warning}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي العملاء</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0', color: theme.text }}>{(users || []).filter(u => u.role === 'عميل').length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: theme.text, margin: 0 }}>إدارة الموظفين والعملاء</h2>
              <button onClick={addEmployee} style={{ padding: '10px 20px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة موظف جديد</button>
            </div>
            <div style={{ display: 'grid', gap: '15px' }}>
              {(users || []).map(u => (
                <div key={u.id} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{u.name}</strong>
                    <span style={{ margin: '0 10px', padding: '5px 10px', backgroundColor: u.role === 'موظف' ? '#e8f8f5' : '#f4f6f6', color: u.role === 'موظف' ? theme.success : theme.gray, borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>{u.role}</span>
                    <div style={{ color: theme.gray, marginTop: '5px' }}>{u.phone} {u.branch && `| 🏪 فرع: ${u.branch}`}</div>
                  </div>
                  {u.role !== 'مدير' && (
                    <button onClick={() => deleteItem('users', u.id)} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => { const n = prompt("اسم القسم:"); if(n) fetch(`${API_URL}/api/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: n})}).then(fetchData); }} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة قسم</button>
              <button onClick={addProduct} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة منتج بالصورة</button>
            </div>
            
            {(categories || []).map(c => (
              <div key={c.id} style={{ marginBottom: '30px', backgroundColor: theme.card, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: theme.text }}>{c.name} (ID: {c.id})</h3>
                  <button onClick={() => deleteItem('categories', c.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف القسم</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {(products || []).filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* عرض الصورة إذا كانت موجودة، وإلا عرض أيقونة */}
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#ddd', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍔'}
                        </div>
                        <div>
                          <strong style={{ fontSize: '16px' }}>{p.name}</strong>
                          <div style={{ color: theme.secondary, fontWeight: 'bold', marginTop: '5px' }}>{p.price} ريال</div>
                        </div>
                      </div>
                      <button onClick={() => deleteItem('products', p.id)} style={{ padding: '8px 15px', backgroundColor: theme.gray, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ backgroundColor: theme.card, padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>إعدادات التطبيقات (العميل والفرع)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.gray }}>اسم المطعم / التطبيق</label>
                <input type="text" value={settings.appName} onChange={e => setSettings({...settings, appName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.gray }}>رابط الشعار (Logo URL)</label>
                <input type="text" placeholder="https://example.com/logo.png" value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value} )} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.gray }}>رسالة الترحيب للعملاء</label>
                <textarea value={settings.welcomeMsg} onChange={e => setSettings({...settings, welcomeMsg: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', minHeight: '100px' }} />
              </div>
              <button onClick={() => showToast("تم حفظ الإعدادات بنجاح ✅")} style={{ padding: '15px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>حفظ الإعدادات</button>
            </div>
          </div>
        )}

        {/* باقي التبويبات (الطلبات والفروع) تعمل بنفس الكفاءة السابقة */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>مراقبة الطلبات الحية</h2>
            <div style={{ backgroundColor: theme.card, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ backgroundColor: theme.primary, color: 'white' }}>
                  <tr>
                    <th style={{ padding: '15px' }}>رقم الطلب</th>
                    <th style={{ padding: '15px' }}>العميل</th>
                    <th style={{ padding: '15px' }}>الفرع</th>
                    <th style={{ padding: '15px' }}>الحالة</th>
                    <th style={{ padding: '15px' }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders || []).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>#{o.id}</td>
                      <td style={{ padding: '15px' }}>{o.customerName}</td>
                      <td style={{ padding: '15px' }}>{o.branch}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', backgroundColor: o.status === 'مكتمل' ? '#e8f8f5' : '#fef5e7', color: o.status === 'مكتمل' ? theme.success : theme.warning }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: theme.secondary }}>{o.totalPrice} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: theme.text, margin: 0 }}>إدارة الفروع</h2>
              <button onClick={() => { const n = prompt("اسم الفرع:"); if(n) fetch(`${API_URL}/api/branches`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: n})}).then(fetchData); }} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة فرع</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {(branches || []).map(b => (
                <div key={b.id} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <strong style={{ fontSize: '18px' }}>{b.name}</strong>
                  <button onClick={() => deleteItem('branches', b.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
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
