import { useState, useEffect, useCallback } from 'react';

export default function App() {
  // ================= إعدادات الحالة (State) =================
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')) || null; } 
    catch (error) { return null; }
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

  // إعدادات التطبيق الشاملة
  const [settings, setSettings] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('global_app_settings')) || {
        customer: { name: 'مطعم أبو محل', logo: '', welcome: 'أهلاً بك في مطعمنا! 🍔' },
        branch: { name: 'بوابة المطبخ', logo: '' },
        admin: { name: 'الإدارة المركزية', logo: '' }
      }; 
    } catch (error) { return null; }
  });

  // نظام النوافذ المنبثقة (Modals)
  const [modal, setModal] = useState({ isOpen: false, type: '', action: '', data: null });
  const [formData, setFormData] = useState({});

  const API_URL = 'https://abumahal-backend.onrender.com';

  const theme = {
    primary: '#1a252f', 
    secondary: '#e31837', 
    bg: '#f4f7f6', 
    card: '#ffffff',
    text: '#2c3e50', 
    gray: '#95a5a6', 
    success: '#27ae60', 
    warning: '#f39c12', 
    danger: '#e74c3c',
    glass: 'rgba(255, 255, 255, 0.95)'
  };

  // ================= التأثيرات وجلب البيانات =================
  useEffect(() => {
    if (admin) localStorage.setItem('admin_user', JSON.stringify(admin));
    else localStorage.removeItem('admin_user');
  }, [admin]);

  useEffect(() => {
    localStorage.setItem('global_app_settings', JSON.stringify(settings));
  }, [settings]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!admin) return;
    try {
      const [usersRes, branchesRes, catsRes, prodsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/users`), 
        fetch(`${API_URL}/api/branches`),
        fetch(`${API_URL}/api/categories`), 
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/orders`)
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data.reverse() : []);
      }
    } catch (error) { console.error("Fetch error:", error); }
  }, [admin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ================= معالجة العمليات (Handlers) =================
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

  const saveSettings = () => {
    localStorage.setItem('global_app_settings', JSON.stringify(settings));
    showToast("تم حفظ إعدادات التطبيقات بنجاح ✅");
  };

  // ================= نظام CRUD المتكامل =================
  const openModal = (type, action, data = null) => {
    setFormData(data || {});
    setModal({ isOpen: true, type, action, data });
  };

  const closeModal = () => setModal({ isOpen: false, type: '', action: '', data: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, action, data } = modal;
    
    let url = `${API_URL}/api/${type}`;
    let method = action === 'add' ? 'POST' : 'PUT';
    
    if (action === 'edit') {
      url = `${API_URL}/api/${type}/${data.id}`;
    } else if (type === 'users' && action === 'add') {
      url = `${API_URL}/api/register`;
    }

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.error) return showToast(result.error);
      
      showToast(`تمت العملية بنجاح`);
      fetchData(); closeModal();
    } catch (error) { showToast("حدث خطأ أثناء الحفظ"); }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟ لا يمكن التراجع!")) return;
    try {
      await fetch(`${API_URL}/api/${type}/${id}`, { method: 'DELETE' });
      fetchData(); showToast("تم الحذف بنجاح");
    } catch (error) { showToast("حدث خطأ أثناء الحذف"); }
  };

  // ================= مكون النافذة المنبثقة الإبداعي =================
  const Modal = () => {
    if (!modal.isOpen) return null;
    const titles = { users: 'الموظف', categories: 'القسم', products: 'المنتج', branches: 'الفرع' };
    const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '16px', width: '100%', boxSizing: 'border-box' };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, animation: 'fadeIn 0.3s' }}>
        <div style={{ background: theme.glass, padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '500px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <h2 style={{ color: theme.primary, marginTop: 0, borderBottom: `2px solid ${theme.secondary}`, paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{modal.action === 'add' ? '✨ إضافة' : '✏️ تعديل'} {titles[modal.type]}</span>
            <span onClick={closeModal} style={{ cursor: 'pointer', color: theme.gray }}>✖</span>
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            {modal.type === 'users' && (
              <>
                <input placeholder="الاسم" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
                <input placeholder="رقم الجوال" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})} required style={inputStyle} />
                {modal.action === 'add' && <input placeholder="الرقم السري" type="password" value={formData.password || ''} onChange={e=>setFormData({...formData, password: e.target.value})} required style={inputStyle} />}
                <select value={formData.role || 'موظف'} onChange={e=>setFormData({...formData, role: e.target.value})} style={inputStyle}>
                  <option value="موظف">موظف مطبخ</option><option value="مدير">مدير</option><option value="عميل">عميل</option>
                </select>
                {formData.role === 'موظف' && (
                  <select value={formData.branch || ''} onChange={e=>setFormData({...formData, branch: e.target.value})} required style={inputStyle}>
                    <option value="">اختر الفرع...</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                )}
              </>
            )}

            {(modal.type === 'categories' || modal.type === 'branches') && (
              <input placeholder={`اسم ${titles[modal.type]}`} value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
            )}
            
            {modal.type === 'products' && (
              <>
                <input placeholder="اسم المنتج" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
                <input placeholder="السعر" type="number" step="0.01" value={formData.price || ''} onChange={e=>setFormData({...formData, price: parseFloat(e.target.value)})} required style={inputStyle} />
                <input placeholder="رابط الصورة (اختياري)" value={formData.imageUrl || ''} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} style={inputStyle} />
                <select value={formData.categoryId || ''} onChange={e=>setFormData({...formData, categoryId: parseInt(e.target.value)})} required style={inputStyle}>
                  <option value="">اختر القسم...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: theme.secondary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>💾 حفظ</button>
              <button type="button" onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#e0e0e0', color: theme.text, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ================= شاشة تسجيل الدخول =================
  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.primary, fontFamily: 'sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: theme.secondary, color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 9999 }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', fontSize: '50px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: theme.primary, textAlign: 'center', marginBottom: '30px' }}>{settings.admin.name}</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />
            <button type="submit" style={{ padding: '15px', border: 'none', borderRadius: '8px', backgroundColor: theme.secondary, color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>دخول الإدارة</button>
          </form>
        </div>
      </div>
    );
  }

  const totalRevenue = (orders || []).filter(o => o.status === 'مكتمل').reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // ================= الواجهة الرئيسية =================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 
        @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
      
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px 30px', borderRadius: '30px', zIndex: 10000 }}>{toast}</div>}
      
      <Modal />
      
      {/* القائمة الجانبية */}
      <div style={{ width: '260px', backgroundColor: theme.primary, color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #34495e', paddingBottom: '20px', marginBottom: '20px' }}>
          {settings.admin.logo ? <img src={settings.admin.logo} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '2px solid white' }} /> : <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏢</div>}
          <h3 style={{ margin: 0 }}>{settings.admin.name}</h3>
          <span style={{ fontSize: '12px', color: theme.gray }}>لوحة التحكم الرئيسية</span>
        </div>
        
        {[
          { id: 'dashboard', name: '📊 الإحصائيات' },
          { id: 'orders', name: '🧾 الطلبات الحية' },
          { id: 'users', name: '👥 الموظفين والعملاء' },
          { id: 'branches', name: '🏪 إدارة الفروع' },
          { id: 'menu', name: '🍔 المنتجات والصور' },
          { id: 'settings', name: '⚙️ إعدادات النظام' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '15px', backgroundColor: activeTab === tab.id ? theme.secondary : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'right', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>{tab.name}</button>
        ))}
        
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setAdmin(null)} style={{ width: '100%', padding: '15px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>تسجيل الخروج</button>
        </div>
      </div>

      {/* منطقة المحتوى */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* 1. تبويب الإحصائيات */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
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

        {/* 2. تبويب الطلبات */}
        {activeTab === 'orders' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>مراقبة الطلبات الحية</h2>
            <div style={{ backgroundColor: theme.card, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ backgroundColor: theme.primary, color: 'white' }}>
                  <tr><th style={{ padding: '15px' }}>رقم الطلب</th><th style={{ padding: '15px' }}>العميل</th><th style={{ padding: '15px' }}>الفرع</th><th style={{ padding: '15px' }}>الحالة</th><th style={{ padding: '15px' }}>الإجمالي</th></tr>
                </thead>
                <tbody>
                  {(orders || []).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>#{o.id}</td>
                      <td style={{ padding: '15px' }}>{o.customerName}</td>
                      <td style={{ padding: '15px' }}>{o.branch}</td>
                      <td style={{ padding: '15px' }}><span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', backgroundColor: o.status === 'مكتمل' ? '#e8f8f5' : '#fef5e7', color: o.status === 'مكتمل' ? theme.success : theme.warning, fontWeight: 'bold' }}>{o.status}</span></td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: theme.secondary }}>{o.totalPrice} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. تبويب المستخدمين */}
        {activeTab === 'users' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: theme.text, margin: 0 }}>إدارة الموظفين والعملاء</h2>
              <button onClick={() => openModal('users', 'add')} style={{ padding: '10px 20px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة مستخدم</button>
            </div>
            <div style={{ display: 'grid', gap: '15px' }}>
              {(users || []).map(u => (
                <div key={u.id} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{u.name}</strong>
                    <span style={{ margin: '0 10px', padding: '5px 10px', backgroundColor: u.role === 'موظف' ? '#e8f8f5' : u.role === 'مدير' ? '#fef5e7' : '#f4f6f6', color: u.role === 'موظف' ? theme.success : u.role === 'مدير' ? theme.warning : theme.gray, borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>{u.role}</span>
                    <div style={{ color: theme.gray, marginTop: '5px' }}>{u.phone} {u.branch && `| 🏪 فرع: ${u.branch}`}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openModal('users', 'edit', u)} style={{ padding: '8px 15px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>تعديل</button>
                    {u.role !== 'مدير' && <button onClick={() => deleteItem('users', u.id)} style={{ padding: '8px 15px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. تبويب الفروع */}
        {activeTab === 'branches' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: theme.text, margin: 0 }}>إدارة الفروع</h2>
              <button onClick={() => openModal('branches', 'add')} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة فرع</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {(branches || []).map(b => (
                <div key={b.id} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <strong style={{ fontSize: '18px' }}>{b.name}</strong>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openModal('branches', 'edit', b)} style={{ padding: '5px 10px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>تعديل</button>
                    <button onClick={() => deleteItem('branches', b.id)} style={{ padding: '5px 10px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. تبويب المنيو */}
        {activeTab === 'menu' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => openModal('categories', 'add')} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة قسم</button>
              <button onClick={() => openModal('products', 'add')} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة منتج</button>
            </div>
            {(categories || []).map(c => (
              <div key={c.id} style={{ marginBottom: '30px', backgroundColor: theme.card, padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: theme.text }}>{c.name}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openModal('categories', 'edit', c)} style={{ padding: '5px 10px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>تعديل</button>
                    <button onClick={() => deleteItem('categories', c.id)} style={{ padding: '5px 10px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {(products || []).filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#ddd', borderRadius: '8px', overflow: 'hidden' }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '24px', textAlign: 'center', lineHeight: '50px' }}>🍔</div>}
                        </div>
                        <div>
                          <strong style={{ fontSize: '16px' }}>{p.name}</strong>
                          <div style={{ color: theme.secondary, fontWeight: 'bold' }}>{p.price} ريال</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => openModal('products', 'edit', p)} style={{ padding: '8px 15px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>تعديل</button>
                        <button onClick={() => deleteItem('products', p.id)} style={{ padding: '8px 15px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. تبويب الإعدادات */}
        {activeTab === 'settings' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>⚙️ إعدادات النظام الشاملة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.secondary}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>📱 تطبيق العميل</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم التطبيق</label>
                    <input type="text" value={settings.customer.name} onChange={e => setSettings({...settings, customer: {...settings.customer, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار</label>
                    <input type="text" value={settings.customer.logo} onChange={e => setSettings({...settings, customer: {...settings.customer, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رسالة الترحيب</label>
                    <textarea value={settings.customer.welcome} onChange={e => setSettings({...settings, customer: {...settings.customer, welcome: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }} />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.warning}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>👨‍🍳 تطبيق المطبخ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم البوابة</label>
                    <input type="text" value={settings.branch.name} onChange={e => setSettings({...settings, branch: {...settings.branch, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار</label>
                    <input type="text" value={settings.branch.logo} onChange={e => setSettings({...settings, branch: {...settings.branch, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.success}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>👑 لوحة الإدارة</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم اللوحة</label>
                    <input type="text" value={settings.admin.name} onChange={e => setSettings({...settings, admin: {...settings.admin, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار</label>
                    <input type="text" value={settings.admin.logo} onChange={e => setSettings({...settings, admin: {...settings.admin, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                </div>
              </div>

            </div>
            <div style={{ marginTop: '30px', textAlign: 'left' }}>
              <button onClick={saveSettings} style={{ padding: '15px 40px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>حفظ الإعدادات</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
