import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Abu Mahal Admin Dashboard - Professional Edition
 * Features: Full CRUD, Real-time Stats, Advanced Search, Image Preview, Global Settings
 */

export default function App() {
  // ================= 1. State Management =================
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')) || null; } 
    catch { return null; }
  });

  const [auth, setAuth] = useState({ phone: '', password: '', loading: false });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  
  // Data State
  const [data, setData] = useState({
    users: [],
    branches: [],
    categories: [],
    products: [],
    orders: [],
    loading: true
  });

  // Global App Settings
  const [settings, setSettings] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('global_app_settings')) || {
        customer: { name: 'مطعم أبو محل', logo: 'https://cdn-icons-png.flaticon.com/512/1996/1996055.png', welcome: 'أهلاً بك في مطعمنا! 🍔' },
        branch: { name: 'بوابة المطبخ', logo: 'https://cdn-icons-png.flaticon.com/512/1830/1830839.png' },
        admin: { name: 'الإدارة المركزية', logo: 'https://cdn-icons-png.flaticon.com/512/2206/2206368.png' }
      }; 
    } catch { return {}; }
  });

  // Modal State
  const [modal, setModal] = useState({ isOpen: false, type: '', action: '', data: null });
  const [formData, setFormData] = useState({});

  const API_URL = 'https://abumahal-backend.onrender.com';

  const theme = {
    primary: '#1a252f', 
    secondary: '#8b0000', // Dark Red
    accent: '#f1c40f',    // Gold
    bg: '#f8f9fa', 
    card: '#ffffff',
    text: '#2c3e50', 
    gray: '#95a5a6', 
    success: '#27ae60', 
    warning: '#f39c12', 
    danger: '#e74c3c',
    glass: 'rgba(255, 255, 255, 0.98)'
  };

  // ================= 2. Utility Functions =================
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${API_URL}${endpoint}`, options);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'حدث خطأ ما');
      return json;
    } catch (error) {
      showToast(error.message, 'danger');
      return null;
    }
  };

  // ================= 3. Data Fetching =================
  const fetchData = useCallback(async () => {
    if (!admin) return;
    const [users, branches, categories, products, orders] = await Promise.all([
      apiCall('/api/users'),
      apiCall('/api/branches'),
      apiCall('/api/categories'),
      apiCall('/api/products'),
      apiCall('/api/orders')
    ]);

    setData({
      users: users || [],
      branches: branches || [],
      categories: categories || [],
      products: products || [],
      orders: Array.isArray(orders) ? orders.reverse() : [],
      loading: false
    });
  }, [admin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (admin) localStorage.setItem('admin_user', JSON.stringify(admin));
    else localStorage.removeItem('admin_user');
  }, [admin]);

  // ================= 4. Handlers =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuth(prev => ({ ...prev, loading: true }));
    const result = await apiCall('/api/login', 'POST', { phone: auth.phone, password: auth.password });
    if (result) {
      if (result.role !== 'مدير') {
        showToast("عذراً، هذه البوابة للمدراء فقط!", 'warning');
      } else {
        setAdmin(result);
        showToast(`أهلاً بك يا ${result.name}`, 'success');
      }
    }
    setAuth(prev => ({ ...prev, loading: false }));
  };

  const handleLogout = () => {
    if (window.confirm("هل تريد تسجيل الخروج؟")) setAdmin(null);
  };

  const openModal = (type, action, item = null) => {
    setFormData(item || {});
    setModal({ isOpen: true, type, action, data: item });
  };

  const closeModal = () => setModal({ isOpen: false, type: '', action: '', data: null });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { type, action, data: item } = modal;
    let endpoint = `/api/${type}`;
    let method = action === 'add' ? 'POST' : 'PUT';

    if (action === 'edit') endpoint += `/${item.id}`;
    if (type === 'users' && action === 'add') endpoint = '/api/register';

    const result = await apiCall(endpoint, method, formData);
    if (result) {
      showToast("تمت العملية بنجاح ✨", 'success');
      fetchData();
      closeModal();
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟ لا يمكن التراجع!")) return;
    const result = await apiCall(`/api/${type}/${id}`, 'DELETE');
    if (result !== null) {
      showToast("تم الحذف بنجاح 🗑️", 'success');
      fetchData();
    }
  };

  // ================= 5. Computed Data =================
  const stats = useMemo(() => {
    const completedOrders = data.orders.filter(o => o.status === 'مكتمل' || o.status === 'جاهز');
    const revenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return {
      revenue,
      totalOrders: data.orders.length,
      totalCustomers: data.users.filter(u => u.role === 'عميل').length,
      totalProducts: data.products.length
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'orders') return data.orders.filter(o => o.customerName.toLowerCase().includes(query) || o.id.toString().includes(query));
    if (activeTab === 'users') return data.users.filter(u => u.name.toLowerCase().includes(query) || u.phone.includes(query));
    if (activeTab === 'menu') return data.products.filter(p => p.name.toLowerCase().includes(query));
    return [];
  }, [searchQuery, activeTab, data]);

  // ================= 6. UI Components =================
  
  // Custom Modal Component
  const RenderModal = () => {
    if (!modal.isOpen) return null;
    const titles = { users: 'مستخدم', categories: 'قسم', products: 'منتج', branches: 'فرع' };
    const inputStyle = { padding: '14px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', fontSize: '16px', width: '100%', transition: '0.3s' };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, animation: 'fadeIn 0.3s' }}>
        <div style={{ background: theme.glass, padding: '35px', borderRadius: '25px', width: '95%', maxWidth: '550px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: `2px solid ${theme.secondary}`, paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, color: theme.primary }}>{modal.action === 'add' ? '➕ إضافة' : '📝 تعديل'} {titles[modal.type]}</h2>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.gray }}>✕</button>
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {modal.type === 'users' && (
              <>
                <input placeholder="الاسم الكامل" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
                <input placeholder="رقم الجوال" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})} required style={inputStyle} />
                {modal.action === 'add' && <input placeholder="كلمة المرور" type="password" value={formData.password || ''} onChange={e=>setFormData({...formData, password: e.target.value})} required style={inputStyle} />}
                <select value={formData.role || 'موظف'} onChange={e=>setFormData({...formData, role: e.target.value})} style={inputStyle}>
                  <option value="موظف">موظف مطبخ</option>
                  <option value="مدير">مدير نظام</option>
                  <option value="عميل">عميل</option>
                </select>
                {formData.role === 'موظف' && (
                  <select value={formData.branch || ''} onChange={e=>setFormData({...formData, branch: e.target.value})} required style={inputStyle}>
                    <option value="">اختر الفرع المسؤول عنه...</option>
                    {data.branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                )}
              </>
            )}

            {(modal.type === 'categories' || modal.type === 'branches') && (
              <input placeholder={`اسم ال${titles[modal.type]}`} value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
            )}

            {modal.type === 'products' && (
              <>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <input placeholder="اسم المنتج" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required style={inputStyle} />
                  </div>
                  <div style={{ width: '120px' }}>
                    <input placeholder="السعر" type="number" step="0.01" value={formData.price || ''} onChange={e=>setFormData({...formData, price: parseFloat(e.target.value)})} required style={inputStyle} />
                  </div>
                </div>
                <select value={formData.categoryId || ''} onChange={e=>setFormData({...formData, categoryId: parseInt(e.target.value)})} required style={inputStyle}>
                  <option value="">اختر القسم...</option>
                  {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="رابط صورة المنتج (URL)" value={formData.imageUrl || ''} onChange={e=>setFormData({...formData, imageUrl: e.target.value})} style={inputStyle} />
                {formData.imageUrl && (
                  <div style={{ textAlign: 'center', background: '#f0f0f0', padding: '10px', borderRadius: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>معاينة الصورة:</p>
                    <img src={formData.imageUrl} alt="Preview" style={{ maxHeight: '100px', borderRadius: '8px' }} onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Error'} />
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 2, padding: '15px', background: theme.secondary, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 5px 15px rgba(139,0,0,0.3)' }}>💾 حفظ البيانات</button>
              <button type="button" onClick={closeModal} style={{ flex: 1, padding: '15px', background: '#eee', color: theme.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Login Screen
  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.primary, fontFamily: 'sans-serif', backgroundImage: 'radial-gradient(circle at center, #2c3e50 0%, #1a252f 100%)' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: toast.type === 'danger' ? theme.danger : theme.secondary, color: 'white', padding: '15px 30px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 10px 20px rgba(0,0,0,0.2)', animation: 'slideDown 0.3s' }}>{toast.msg}</div>}
        <div style={{ backgroundColor: theme.card, padding: '50px', borderRadius: '30px', width: '90%', maxWidth: '450px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <img src={settings.admin.logo} alt="Logo" style={{ width: '100px', marginBottom: '20px', borderRadius: '20px' }} />
          <h1 style={{ color: theme.primary, marginBottom: '10px', fontSize: '28px' }}>{settings.admin.name}</h1>
          <p style={{ color: theme.gray, marginBottom: '40px' }}>لوحة التحكم المركزية - تسجيل الدخول</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>رقم الجوال</label>
              <input type="tel" placeholder="05xxxxxxxx" value={auth.phone} onChange={e => setAuth({...auth, phone: e.target.value})} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #eee', outline: 'none', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>كلمة المرور</label>
              <input type="password" placeholder="••••••••" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} required style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #eee', outline: 'none', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={auth.loading} style={{ padding: '18px', border: 'none', borderRadius: '15px', backgroundColor: theme.secondary, color: 'white', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', boxShadow: '0 10px 20px rgba(139,0,0,0.3)' }}>
              {auth.loading ? 'جاري التحقق...' : 'دخول النظام 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= 7. Main Layout =================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif', color: theme.text }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 
        @keyframes slideUp { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .nav-btn:hover { background: rgba(255,255,255,0.1) !important; transform: translateX(-5px); }
        .stat-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
        table tr:hover { background-color: #f8f9fa; }
      `}</style>
      
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'danger' ? theme.danger : '#333', color: 'white', padding: '15px 35px', borderRadius: '50px', zIndex: 10000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: 'bold' }}>{toast.msg}</div>}
      
      <RenderModal />
      
      {/* Sidebar Navigation */}
      <div style={{ width: '280px', backgroundColor: theme.primary, color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '5px 0 25px rgba(0,0,0,0.2)', zIndex: 100 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={settings.admin.logo} alt="Admin" style={{ width: '90px', height: '90px', borderRadius: '25px', objectFit: 'cover', marginBottom: '15px', border: '3px solid rgba(255,255,255,0.2)', padding: '5px', background: 'white' }} />
          <h3 style={{ margin: 0, fontSize: '20px' }}>{settings.admin.name}</h3>
          <p style={{ fontSize: '13px', color: theme.gray, marginTop: '5px' }}>مرحباً، {admin.name} 👋</p>
        </div>
        
        {[
          { id: 'dashboard', name: '📊 لوحة الإحصائيات', icon: '📈' },
          { id: 'orders', name: '🧾 الطلبات الحية', icon: '🔔' },
          { id: 'users', name: '👥 إدارة المستخدمين', icon: '👤' },
          { id: 'branches', name: '🏪 إدارة الفروع', icon: '📍' },
          { id: 'menu', name: '🍔 قائمة الطعام', icon: '🍽️' },
          { id: 'settings', name: '⚙️ إعدادات النظام', icon: '🛠️' }
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className="nav-btn" style={{ padding: '16px 20px', backgroundColor: activeTab === tab.id ? theme.secondary : 'transparent', color: 'white', border: 'none', borderRadius: '15px', textAlign: 'right', fontSize: '16px', cursor: 'pointer', fontWeight: activeTab === tab.id ? 'bold' : 'normal', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.name}
          </button>
        ))}
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#ff7675', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.3s' }}>🚪 تسجيل الخروج</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        
        {/* Header with Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: theme.primary }}>
              {activeTab === 'dashboard' ? 'الرئيسية' : activeTab === 'orders' ? 'الطلبات' : activeTab === 'users' ? 'المستخدمين' : activeTab === 'branches' ? 'الفروع' : activeTab === 'menu' ? 'المنيو' : 'الإعدادات'}
            </h1>
            <p style={{ color: theme.gray, marginTop: '5px' }}>نظام إدارة مطعم أبو محل المتكامل</p>
          </div>
          
          {['orders', 'users', 'menu'].includes(activeTab) && (
            <div style={{ position: 'relative', width: '350px' }}>
              <input type="text" placeholder="بحث سريع..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '15px 45px 15px 20px', borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', outline: 'none', fontSize: '16px' }} />
              <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>🔍</span>
            </div>
          )}
        </div>

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
              {[
                { label: 'إجمالي المبيعات', value: `${stats.revenue} ريال`, icon: '💰', color: theme.secondary },
                { label: 'عدد الطلبات', value: stats.totalOrders, icon: '📦', color: theme.success },
                { label: 'قاعدة العملاء', value: stats.totalCustomers, icon: '👥', color: theme.warning },
                { label: 'عدد المنتجات', value: stats.totalProducts, icon: '🍔', color: theme.primary }
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ backgroundColor: theme.card, padding: '30px', borderRadius: '25px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', borderRight: `8px solid ${s.color}`, transition: '0.4s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: theme.gray, fontSize: '16px' }}>{s.label}</h3>
                      <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0', color: theme.text }}>{s.value}</p>
                    </div>
                    <span style={{ fontSize: '45px', opacity: 0.8 }}>{s.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
              <div style={{ backgroundColor: theme.card, padding: '30px', borderRadius: '25px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>آخر الطلبات الواردة</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0f0', color: theme.gray }}>
                      <th style={{ padding: '15px' }}>العميل</th>
                      <th style={{ padding: '15px' }}>الفرع</th>
                      <th style={{ padding: '15px' }}>الحالة</th>
                      <th style={{ padding: '15px' }}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.slice(0, 6).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{o.customerName}</td>
                        <td style={{ padding: '15px' }}>{o.branch}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: o.status === 'مكتمل' ? '#e8f8f5' : '#fff4e5', color: o.status === 'مكتمل' ? theme.success : theme.warning }}>{o.status}</span>
                        </td>
                        <td style={{ padding: '15px', color: theme.secondary, fontWeight: 'bold' }}>{o.totalPrice} ريال</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ backgroundColor: theme.card, padding: '30px', borderRadius: '25px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>توزيع الفروع</h3>
                {data.branches.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span>{b.name}</span>
                    <span style={{ fontWeight: 'bold', color: theme.secondary }}>{data.orders.filter(o => o.branch === b.name).length} طلب</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Orders Tab */}
        {activeTab === 'orders' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ backgroundColor: theme.card, borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ backgroundColor: theme.primary, color: 'white' }}>
                  <tr>
                    <th style={{ padding: '20px' }}>رقم الطلب</th>
                    <th style={{ padding: '20px' }}>العميل</th>
                    <th style={{ padding: '20px' }}>الفرع</th>
                    <th style={{ padding: '20px' }}>نوع الطلب</th>
                    <th style={{ padding: '20px' }}>الحالة</th>
                    <th style={{ padding: '20px' }}>الإجمالي</th>
                    <th style={{ padding: '20px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '20px', fontWeight: 'bold' }}>#{o.id}</td>
                      <td style={{ padding: '20px' }}>{o.customerName}</td>
                      <td style={{ padding: '20px' }}>{o.branch}</td>
                      <td style={{ padding: '20px' }}>{o.orderType}</td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ padding: '8px 15px', borderRadius: '25px', fontSize: '13px', fontWeight: 'bold', backgroundColor: o.status === 'مكتمل' ? '#e8f8f5' : o.status === 'جاهز' ? '#eafaf1' : '#fef5e7', color: o.status === 'مكتمل' ? theme.success : o.status === 'جاهز' ? '#2ecc71' : theme.warning }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '20px', fontWeight: 'bold', color: theme.secondary }}>{o.totalPrice} ريال</td>
                      <td style={{ padding: '20px' }}>
                        <button onClick={() => handleDelete('orders', o.id)} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '18px' }} title="حذف الطلب">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length === 0 && <div style={{ padding: '50px', textAlign: 'center', color: theme.gray }}>لا توجد طلبات مطابقة للبحث</div>}
            </div>
          </div>
        )}

        {/* 3. Users Tab */}
        {activeTab === 'users' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
              <button onClick={() => openModal('users', 'add')} style={{ padding: '15px 30px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(139,0,0,0.2)' }}>+ إضافة مستخدم جديد</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {filteredItems.map(u => (
                <div key={u.id} style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', borderLeft: `5px solid ${u.role === 'مدير' ? theme.accent : u.role === 'موظف' ? theme.success : theme.gray}` }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                      {u.role === 'مدير' ? '👑' : u.role === 'موظف' ? '👨‍🍳' : '👤'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '18px' }}>{u.name}</h4>
                      <p style={{ margin: '5px 0', color: theme.gray, fontSize: '14px' }}>{u.phone}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: theme.primary }}>{u.role}</span>
                        {u.branch && <span style={{ padding: '4px 10px', backgroundColor: '#e8f8f5', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: theme.success }}>📍 {u.branch}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => openModal('users', 'edit', u)} style={{ background: '#f1c40f22', border: 'none', color: theme.warning, padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>✏️</button>
                    {u.role !== 'مدير' && <button onClick={() => handleDelete('users', u.id)} style={{ background: '#e74c3c22', border: 'none', color: theme.danger, padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Branches Tab */}
        {activeTab === 'branches' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
              <button onClick={() => openModal('branches', 'add')} style={{ padding: '15px 30px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(39,174,96,0.2)' }}>+ إضافة فرع جديد</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {data.branches.map(b => (
                <div key={b.id} style={{ backgroundColor: theme.card, padding: '30px', borderRadius: '25px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '15px' }}>🏪</div>
                  <h3 style={{ margin: '0 0 10px 0' }}>{b.name}</h3>
                  <p style={{ color: theme.gray, fontSize: '14px', marginBottom: '20px' }}>إجمالي الطلبات: {data.orders.filter(o => o.branch === b.name).length}</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => openModal('branches', 'edit', b)} style={{ flex: 1, padding: '10px', backgroundColor: theme.warning, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>تعديل</button>
                    <button onClick={() => handleDelete('branches', b.id)} style={{ flex: 1, padding: '10px', backgroundColor: theme.danger, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Menu Tab */}
        {activeTab === 'menu' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginBottom: '30px' }}>
              <button onClick={() => openModal('categories', 'add')} style={{ padding: '15px 25px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة قسم</button>
              <button onClick={() => openModal('products', 'add')} style={{ padding: '15px 25px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة منتج جديد</button>
            </div>
            
            {data.categories.map(c => (
              <div key={c.id} style={{ marginBottom: '40px', backgroundColor: theme.card, padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '25px' }}>
                  <h2 style={{ margin: 0, color: theme.primary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>📁</span> {c.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openModal('categories', 'edit', c)} style={{ padding: '8px 15px', backgroundColor: '#f1c40f22', color: theme.warning, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>تعديل القسم</button>
                    <button onClick={() => handleDelete('categories', c.id)} style={{ padding: '8px 15px', backgroundColor: '#e74c3c22', color: theme.danger, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>حذف القسم</button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {data.products.filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: '20px', backgroundColor: '#fbfbfb', padding: '20px', borderRadius: '20px', border: '1px solid #f0f0f0', transition: '0.3s' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#eee', flexShrink: 0 }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '35px', textAlign: 'center', lineHeight: '80px' }}>🍔</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{p.name}</h4>
                        <p style={{ margin: 0, color: theme.secondary, fontWeight: 'bold', fontSize: '16px' }}>{p.price} ريال</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                          <button onClick={() => openModal('products', 'edit', p)} style={{ flex: 1, padding: '8px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>تعديل</button>
                          <button onClick={() => handleDelete('products', p.id)} style={{ flex: 1, padding: '8px', backgroundColor: 'white', border: '1px solid #ffcccc', color: theme.danger, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>حذف</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.products.filter(p => p.categoryId === c.id).length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: theme.gray }}>لا توجد منتجات في هذا القسم</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ animation: 'fadeIn 0.6s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
              
              {/* Customer App Settings */}
              <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderTop: `10px solid ${theme.secondary}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>📱 تطبيق العميل</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم المطعم</label>
                    <input type="text" value={settings.customer.name} onChange={e => setSettings({...settings, customer: {...settings.customer, name: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.customer.logo} onChange={e => setSettings({...settings, customer: {...settings.customer, logo: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>رسالة الترحيب</label>
                    <textarea value={settings.customer.welcome} onChange={e => setSettings({...settings, customer: {...settings.customer, welcome: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '100px', resize: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Branch App Settings */}
              <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderTop: `10px solid ${theme.success}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>👨‍🍳 تطبيق المطبخ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم بوابة المطبخ</label>
                    <input type="text" value={settings.branch.name} onChange={e => setSettings({...settings, branch: {...settings.branch, name: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.branch.logo} onChange={e => setSettings({...settings, branch: {...settings.branch, logo: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                </div>
              </div>

              {/* Admin Panel Settings */}
              <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderTop: `10px solid ${theme.accent}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>👑 لوحة الإدارة</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>اسم لوحة التحكم</label>
                    <input type="text" value={settings.admin.name} onChange={e => setSettings({...settings, admin: {...settings.admin, name: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.admin.logo} onChange={e => setSettings({...settings, admin: {...settings.admin, logo: e.target.value}})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                </div>
              </div>

            </div>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button onClick={() => { localStorage.setItem('global_app_settings', JSON.stringify(settings)); showToast("تم حفظ جميع الإعدادات بنجاح ✅", 'success'); }} style={{ padding: '20px 60px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '20px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(39,174,96,0.3)', transition: '0.3s' }}>💾 حفظ الإعدادات الشاملة</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
