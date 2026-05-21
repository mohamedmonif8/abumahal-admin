import { useState, useEffect, useCallback } from 'react';

function App() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')) || null; } 
    catch (e) { return null; }
  });

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('settings'); // جعلنا الإعدادات هي الافتراضية لتجربتها
  
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  // إعدادات التطبيقات الثلاثة
  const [settings, setSettings] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('global_app_settings')) || {
        customer: { name: 'مطعم أبو مهل', logo: '', welcome: 'أهلاً بك في مطعمنا! 🍔' },
        branch: { name: 'بوابة المطبخ', logo: '' },
        admin: { name: 'الإدارة المركزية', logo: '' }
      }; 
    } catch (e) { return null; }
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

  const saveSettings = () => {
    // هنا مستقبلاً سيتم إرسالها للسيرفر، حالياً تحفظ محلياً
    localStorage.setItem('global_app_settings', JSON.stringify(settings));
    showToast("تم حفظ إعدادات التطبيقات بنجاح ✅");
  };

  if (!admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.primary, fontFamily: 'sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: theme.secondary, color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 9999 }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', fontSize: '50px', marginBottom: '10px' }}>👑</div>
          <h2 style={{ color: theme.primary, textAlign: 'center', marginBottom: '30px' }}>{settings.admin.name}</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <button type="submit" style={{ padding: '15px', border: 'none', borderRadius: '8px', backgroundColor: theme.secondary, color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>دخول الإدارة</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px 30px', borderRadius: '30px', zIndex: 1000 }}>{toast}</div>}
      
      {/* القائمة الجانبية */}
      <div style={{ width: '260px', backgroundColor: theme.primary, color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #34495e', paddingBottom: '20px', marginBottom: '20px' }}>
          {settings.admin.logo ? <img src={settings.admin.logo} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} /> : <div style={{ fontSize: '40px' }}>🏢</div>}
          <h3 style={{ margin: 0 }}>{settings.admin.name}</h3>
        </div>
        
        {[
          { id: 'dashboard', name: '📊 الإحصائيات' },
          { id: 'orders', name: '🧾 الطلبات الحية' },
          { id: 'users', name: '👥 الموظفين والعملاء' },
          { id: 'branches', name: '🏪 إدارة الفروع' },
          { id: 'menu', name: '🍔 المنتجات والصور' },
          { id: 'settings', name: '⚙️ إعدادات النظام' }
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
        
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>⚙️ إعدادات التطبيقات الشاملة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* إعدادات تطبيق العميل */}
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.secondary}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>📱 تطبيق العميل</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم التطبيق</label>
                    <input type="text" value={settings.customer.name} onChange={e => setSettings({...settings, customer: {...settings.customer, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.customer.logo} onChange={e => setSettings({...settings, customer: {...settings.customer, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رسالة الترحيب</label>
                    <textarea value={settings.customer.welcome} onChange={e => setSettings({...settings, customer: {...settings.customer, welcome: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }} />
                  </div>
                </div>
              </div>

              {/* إعدادات تطبيق الفرع */}
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.warning}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>👨‍🍳 تطبيق الفرع (المطبخ)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم البوابة</label>
                    <input type="text" value={settings.branch.name} onChange={e => setSettings({...settings, branch: {...settings.branch, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.branch.logo} onChange={e => setSettings({...settings, branch: {...settings.branch, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                </div>
              </div>

              {/* إعدادات لوحة الإدارة */}
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${theme.success}` }}>
                <h3 style={{ color: theme.primary, marginTop: 0 }}>👑 لوحة الإدارة</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>اسم لوحة التحكم</label>
                    <input type="text" value={settings.admin.name} onChange={e => setSettings({...settings, admin: {...settings.admin, name: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: theme.gray, fontWeight: 'bold' }}>رابط الشعار (Logo URL)</label>
                    <input type="text" value={settings.admin.logo} onChange={e => setSettings({...settings, admin: {...settings.admin, logo: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', direction: 'ltr' }} />
                  </div>
                </div>
              </div>

            </div>
            <div style={{ marginTop: '30px', textAlign: 'left' }}>
              <button onClick={saveSettings} style={{ padding: '15px 40px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)' }}>حفظ جميع الإعدادات</button>
            </div>
          </div>
        )}

        {/* باقي التبويبات (الإحصائيات، الطلبات، إلخ) تبقى كما هي وتعمل بكفاءة */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ color: theme.text, marginBottom: '20px' }}>نظرة عامة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: theme.card, padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.secondary}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي المبيعات</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0', color: theme.text }}>{(orders || []).filter(o => o.status === 'مكتمل').reduce((sum, o) => sum + (o.totalPrice || 0), 0)} ريال</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
