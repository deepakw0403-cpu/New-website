import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Plus, Building2, Users, X, Loader2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null); // brand detail view
  const [detail, setDetail] = useState(null);

  const [form, setForm] = useState({
    name: "", gst: "", address: "", phone: "",
    admin_user_email: "", admin_user_name: "",
    allowed_category_ids: [],
  });
  const [creating, setCreating] = useState(false);
  const [tempPw, setTempPw] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get("/admin/brands"),
        api.get("/categories"),
      ]);
      setBrands(bRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      toast.error("Failed to load brands");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (brand) => {
    setSelected(brand);
    try {
      const res = await api.get(`/admin/brands/${brand.id}`);
      setDetail(res.data);
    } catch (err) {
      toast.error("Failed to load brand detail");
    }
  };

  const toggleCategory = (id) => {
    setForm(f => ({
      ...f,
      allowed_category_ids: f.allowed_category_ids.includes(id)
        ? f.allowed_category_ids.filter(x => x !== id)
        : [...f.allowed_category_ids, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.admin_user_email || !form.admin_user_name) {
      toast.error("Name, brand admin email and name are required"); return;
    }
    if (form.allowed_category_ids.length === 0) {
      if (!window.confirm("No categories selected. The brand will see an empty catalog until you update this. Continue?")) return;
    }
    setCreating(true);
    try {
      const res = await api.post("/admin/brands", form);
      setTempPw({ email: form.admin_user_email, password: res.data.temporary_password_for_reference });
      toast.success("Brand created — welcome email sent");
      setForm({ name: "", gst: "", address: "", phone: "", admin_user_email: "", admin_user_name: "", allowed_category_ids: [] });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Create failed");
    }
    setCreating(false);
  };

  const suspendBrand = async (brand) => {
    if (!window.confirm(`Soft-delete '${brand.name}' and suspend all users?`)) return;
    try {
      await api.delete(`/admin/brands/${brand.id}`);
      toast.success("Brand suspended");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const addUserToBrand = async () => {
    const email = window.prompt("New user email:");
    if (!email) return;
    const name = window.prompt("User full name:");
    if (!name) return;
    const role = window.prompt("Role (brand_admin or brand_user):", "brand_user") || "brand_user";
    try {
      const res = await api.post(`/admin/brands/${selected.id}/users`, { email, name, role });
      toast.success("User created — welcome email sent");
      openDetail(selected);
      alert(`Temporary password (save this, emailed too):\n${res.data.temporary_password_for_reference}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Create failed");
    }
  };

  const removeUser = async (userId) => {
    if (!window.confirm("Suspend this user?")) return;
    try {
      await api.delete(`/admin/brands/${selected.id}/users/${userId}`);
      openDetail(selected);
      toast.success("User suspended");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="admin-brands-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={22} /> Brands
          </h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise customers with curated catalogs + credit lines</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm" data-testid="create-brand-btn">
          <Plus size={16} /> Create Brand
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : brands.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <Building2 className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-gray-700 font-medium mb-1">No brands yet</h3>
          <p className="text-sm text-gray-500">Click "Create Brand" to onboard your first enterprise customer.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">GST</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50" data-testid={`brand-row-${b.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.phone || b.address || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{b.gst || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {(b.allowed_category_ids || []).length} {((b.allowed_category_ids || []).length === 1) ? 'category' : 'categories'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.user_count}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openDetail(b)} className="text-emerald-700 hover:underline text-xs" data-testid={`brand-detail-${b.id}`}>Manage</button>
                    {b.status === 'active' && (
                      <button onClick={() => suspendBrand(b)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="create-brand-modal">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Brand</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Brand Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="create-brand-name" />
                <input placeholder="GST Number" value={form.gst} onChange={e => setForm({...form, gst: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Initial Brand Admin User</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="email" placeholder="Admin Email *" value={form.admin_user_email} onChange={e => setForm({...form, admin_user_email: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="create-brand-admin-email" />
                  <input required placeholder="Admin Full Name *" value={form.admin_user_name} onChange={e => setForm({...form, admin_user_name: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="create-brand-admin-name" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Allowed Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button type="button" key={c.id} onClick={() => toggleCategory(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${form.allowed_category_ids.includes(c.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
                      data-testid={`cat-chip-${c.id}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={creating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50" data-testid="submit-create-brand">
                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Brand & Send Welcome Email"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Temp password display after create */}
      {tempPw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setTempPw(null); setShowCreate(false); }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-emerald-700 mb-2">Brand Created</h3>
            <p className="text-sm text-gray-600 mb-3">Welcome email sent to <strong>{tempPw.email}</strong>. Password below is for your records:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between font-mono text-sm mb-4">
              <span>{tempPw.password}</span>
              <button onClick={() => { navigator.clipboard.writeText(tempPw.password); toast.success("Copied"); }}><Copy size={14} /></button>
            </div>
            <button onClick={() => { setTempPw(null); setShowCreate(false); }} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium">Done</button>
          </div>
        </div>
      )}

      {/* Detail side-panel */}
      {selected && detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()} data-testid="brand-detail-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{detail.brand?.name}</h2>
              <button onClick={() => { setSelected(null); setDetail(null); }}><X size={18} /></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">GST</span><p className="font-medium text-gray-800">{detail.brand?.gst || '—'}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium text-gray-800">{detail.brand?.phone || '—'}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Address</span><p className="font-medium text-gray-800">{detail.brand?.address || '—'}</p></div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">ALLOWED CATEGORIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {(detail.brand?.allowed_category_ids || []).map(id => {
                    const c = categories.find(x => x.id === id);
                    return <span key={id} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">{c?.name || id}</span>;
                  })}
                  {(detail.brand?.allowed_category_ids || []).length === 0 && <span className="text-xs text-gray-400">None unlocked yet</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500"><Users size={12} className="inline mr-1" />USERS ({detail.users?.length || 0})</p>
                  <button onClick={addUserToBrand} className="text-xs text-emerald-700 hover:underline" data-testid="add-brand-user-btn">+ Add User</button>
                </div>
                <div className="space-y-1.5">
                  {(detail.users || []).map(u => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border border-gray-100 text-xs">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-gray-500">{u.email} · {u.role} · {u.status}</p>
                      </div>
                      {u.status === 'active' && (
                        <button onClick={() => removeUser(u.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <strong>Coming in Slice 2:</strong> Credit lines (multi-lender with OTP), payment uploads, FIFO debit on orders, sample credits + Razorpay top-up.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
