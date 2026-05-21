import { useState, useEffect, useCallback } from 'react';

function App() {
  // حفظ جلسة المدير حتى لا يخرج عند تحديث الصفحة
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

  const API_URL = 'https://abumahal-backend.onrender.com';

  const theme = {
    primary: '#2c3e50', secondary: '#e31837', bg: '#f4f7f6', card: '#ffffff', 
    text: '#333', gray: '#7f8c8d', success: '#27ae60', warning: '#f39c12'
  };

  const getId = (item ) => item._id || item.id;

  useEffect(() => {
    if (admin) localStorage.setItem('admin_user', JSON.stringify(admin));
    else localStorage.removeItem('admin_user');
  }, [admin]);

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
      if (ordersRes.ok) setOrders((await ordersRes.json()).reverse());
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, [admin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // تحديث البيانات كل 5 ثوانٍ
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
      
      setAdmin(data);
      showToast(`أهلاً بك يا ${data.name}`);
    } catch (error) { showToast("خطأ في الاتصال بالخادم"); }
  };

  // دالة لحساب الوقت المستغرق (تقريبي بناءً على وقت الإنشاء والتحديث)
  const calculateTimeTaken = (order) => {
    if (!order.createdAt || !order.updatedAt) return "غير متوفر";
    const start = new Date(order.createdAt).getTime();
    const end = new Date(order.updatedAt).getTime();
    const diffMins = Math.round((end - start) / 60000);
    
    if (order.status === 'قيد الانتظار') return "جاري الحساب...";
    if (diffMins === 0) return "أقل من دقيقة";
    return `${diffMins} دقيقة`;
  };

  // إضافة فرع جديد
  const addBranch = async () => {
    const name = prompt("أدخل اسم الفرع الجديد:");
    if (!name) return;
    try {
      await fetch(`${API_URL}/api/branches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      });
      fetchData(); showToast("تمت إضافة الفرع بنجاح");
    } catch (e) { showToast("حدث خطأ"); }
  };

  // إضافة قسم جديد
  const addCategory = async () => {
    const name = prompt("أدخل اسم القسم الجديد:");
    if (!name) return;
    try {
      await fetch(`${API_URL}/api/categories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      });
      fetchData(); showToast("تمت إضافة القسم بنجاح");
    } catch (e) { showToast("حدث خطأ"); }
  };

  // إضافة منتج جديد
  const addProduct = async () => {
    if (categories.length === 0) return showToast("الرجاء إضافة قسم أولاً!");
    const name = prompt("اسم المنتج:");
    const price = prompt("السعر:");
    const categoryId = prompt(`أدخل رقم القسم:\n${categories.map(c => `${getId(c)}: ${c.name}`).join('\n')}`);
    
    if (!name || !price || !categoryId) return;
    try {
      await fetch(`${API_URL}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name, price: parseFloat(price), categoryId: parseInt(categoryId) })
      });
      fetchData(); showToast("تمت إضافة المنتج بنجاح");
    } catch (e) { showToast("حدث خطأ"); }
  };

  // حذف عنصر
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
        {toast && <div style={{ position: 'fixed', top: 20, background: theme.secondary, color: 'white', padding: '15px 30px', borderRadius: '8px' }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '15px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: theme.primary, textAlign: 'center', marginBottom: '30px' }}>لوحة تحكم الإدارة 👑</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
            <button type="submit" style={{ padding: '15px', border: 'none', borderRadius: '8px', backgroundColor: theme.primary, color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>دخول الإدارة</button>
          </form>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status === 'مكتمل').reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px 30px', borderRadius: '30px', zIndex: 1000 }}>{toast}</div>}
      
      {/* القائمة الجانبية */}
      <div style={{ width: '250px', backgroundColor: theme.primary, color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '20px', marginBottom: '20px' }}>أبو مهل - الإدارة</h2>
        
        {[
          { id: 'dashboard', name: '📊 الإحصائيات' },
          { id: 'orders', name: '🧾 مراقبة الطلبات' },
          { id: 'users', name: '👥 المستخدمين' },
          { id: 'branches', name: '🏪 الفروع' },
          { id: 'menu', name: '🍔 المنيو' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '15px', backgroundColor: activeTab === tab.id ? theme.secondary : 'transparent', color: 'white', border: 'none', borderRadius: '8px', textAlign: 'right', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
            {tab.name}
          </button>
        ))}
        
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setAdmin(null)} style={{ width: '100%', padding: '15px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>تسجيل الخروج</button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ color: theme.primary, marginBottom: '20px' }}>نظرة عامة</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.secondary}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي المبيعات</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0', color: theme.primary }}>{totalRevenue} ريال</p>
              </div>
              <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.success}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>إجمالي الطلبات</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0', color: theme.primary }}>{orders.length}</p>
              </div>
              <div style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRight: `5px solid ${theme.warning}` }}>
                <h3 style={{ margin: 0, color: theme.gray }}>العملاء المسجلين</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0', color: theme.primary }}>{users.filter(u => u.role === 'عميل').length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 style={{ color: theme.primary, marginBottom: '20px' }}>مراقبة الطلبات وحركة المستخدمين</h2>
            <div style={{ backgroundColor: theme.card, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead style={{ backgroundColor: theme.primary, color: 'white' }}>
                  <tr>
                    <th style={{ padding: '15px' }}>رقم الطلب</th>
                    <th style={{ padding: '15px' }}>العميل</th>
                    <th style={{ padding: '15px' }}>الفرع</th>
                    <th style={{ padding: '15px' }}>الحالة</th>
                    <th style={{ padding: '15px' }}>وقت التجهيز</th>
                    <th style={{ padding: '15px' }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={getId(o)} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>#{getId(o).toString().slice(-4)}</td>
                      <td style={{ padding: '15px' }}>{o.customerName}</td>
                      <td style={{ padding: '15px' }}>{o.branch}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', backgroundColor: o.status === 'مكتمل' ? '#e8f8f5' : '#fef5e7', color: o.status === 'مكتمل' ? theme.success : theme.warning }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: theme.secondary, fontWeight: 'bold' }}>{calculateTimeTaken(o)}</td>
                      <td style={{ padding: '15px' }}>{o.totalPrice} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ color: theme.primary, marginBottom: '20px' }}>إدارة المستخدمين والموظفين</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {users.map(u => (
                <div key={getId(u)} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{u.name}</strong>
                    <span style={{ margin: '0 10px', padding: '3px 8px', backgroundColor: '#eee', borderRadius: '5px', fontSize: '12px' }}>{u.role}</span>
                    <div style={{ color: theme.gray, marginTop: '5px' }}>{u.phone} {u.branch && `- فرع ${u.branch}`}</div>
                  </div>
                  {u.role !== 'مدير' && (
                    <button onClick={() => deleteItem('users', getId(u))} style={{ padding: '8px 15px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: theme.primary, margin: 0 }}>إدارة الفروع</h2>
              <button onClick={addBranch} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة فرع</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {branches.map(b => (
                <div key={getId(b)} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <strong style={{ fontSize: '18px' }}>{b.name}</strong>
                  <button onClick={() => deleteItem('branches', getId(b))} style={{ padding: '5px 10px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={addCategory} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة قسم</button>
              <button onClick={addProduct} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ إضافة منتج</button>
            </div>
            
            {categories.map(c => (
              <div key={getId(c)} style={{ marginBottom: '30px', backgroundColor: theme.card, padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: theme.primary }}>{c.name} (ID: {getId(c)})</h3>
                  <button onClick={() => deleteItem('categories', getId(c))} style={{ padding: '5px 10px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف القسم</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {products.filter(p => p.categoryId === getId(c)).map(p => (
                    <div key={getId(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ color: theme.secondary, fontWeight: 'bold' }}>{p.price} ريال</div>
                      </div>
                      <button onClick={() => deleteItem('products', getId(p))} style={{ padding: '5px 10px', backgroundColor: theme.gray, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
