import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Upload, Building2, MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { getSellers, getCategories, createSeller, updateSeller, deleteSeller, uploadImage } from "../../lib/api";

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [uploading, setUploading] = useState(false);

  const emptyForm = {
    name: "",
    company_name: "",
    description: "",
    logo_url: "",
    city: "",
    state: "",
    contact_email: "",
    contact_phone: "",
    category_ids: [],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [selRes, catRes] = await Promise.all([getSellers(), getCategories()]);
      setSellers(selRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const toggleCategory = (categoryId) => {
    if (form.category_ids.includes(categoryId)) {
      setForm({ ...form, category_ids: form.category_ids.filter(id => id !== categoryId) });
    } else {
      setForm({ ...form, category_ids: [...form.category_ids, categoryId] });
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await getSellers();
      setSellers(res.data);
    } catch (err) {
      toast.error("Failed to load sellers");
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadImage(file);
      setForm({ ...form, logo_url: res.data.url });
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error("Failed to upload logo");
    }
    setUploading(false);
  };

  const removeLogo = () => {
    setForm({ ...form, logo_url: "" });
  };

  const openCreateModal = () => {
    setEditingSeller(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (seller) => {
    setEditingSeller(seller);
    setForm({
      name: seller.name,
      company_name: seller.company_name,
      description: seller.description || "",
      logo_url: seller.logo_url || "",
      city: seller.city || "",
      state: seller.state || "",
      contact_email: seller.contact_email || "",
      contact_phone: seller.contact_phone || "",
      category_ids: seller.category_ids || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.company_name) {
      toast.error("Please enter name and company name");
      return;
    }

    try {
      if (editingSeller) {
        await updateSeller(editingSeller.id, form);
        toast.success("Seller updated");
      } else {
        await createSeller(form);
        toast.success("Seller created");
      }
      setShowModal(false);
      fetchSellers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save seller");
    }
  };

  const handleDelete = async (seller) => {
    if (!window.confirm(`Delete "${seller.company_name}"? Fabrics associated with this seller will no longer show seller info.`)) return;
    try {
      await deleteSeller(seller.id);
      toast.success("Seller deleted");
      fetchSellers();
    } catch (err) {
      toast.error("Failed to delete seller");
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-sellers-page">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Sellers</h1>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2" data-testid="add-seller-btn">
            <Plus size={18} />
            Add Seller
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 animate-pulse rounded p-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
                <div className="h-5 bg-gray-200 w-2/3 rounded mb-2" />
                <div className="h-4 bg-gray-200 w-full rounded" />
              </div>
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No sellers yet</p>
            <button onClick={openCreateModal} className="btn-primary">Add First Seller</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="sellers-grid">
            {sellers.map((seller) => (
              <div key={seller.id} className="bg-white border border-gray-100 rounded p-6" data-testid={`seller-card-${seller.id}`}>
                <div className="flex items-start gap-4 mb-4">
                  {seller.logo_url ? (
                    <img
                      src={seller.logo_url}
                      alt={seller.company_name}
                      className="w-16 h-16 object-cover rounded-full border border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-xl font-semibold">
                      {seller.company_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{seller.company_name}</h3>
                    <p className="text-gray-500 text-sm">{seller.name}</p>
                    {seller.location && (
                      <p className="text-gray-400 text-sm">{seller.location}</p>
                    )}
                  </div>
                </div>
                
                {seller.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{seller.description}</p>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(seller)}
                    className="flex-1 btn-secondary text-sm py-2 inline-flex items-center justify-center gap-2"
                    data-testid={`edit-seller-${seller.id}`}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(seller)}
                    className="flex-1 btn-secondary text-sm py-2 inline-flex items-center justify-center gap-2 hover:border-red-500 hover:text-red-500"
                    data-testid={`delete-seller-${seller.id}`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="seller-modal">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingSeller ? "Edit Seller" : "Add Seller"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Company Logo</label>
                  <div className="flex items-center gap-4">
                    {form.logo_url ? (
                      <div className="relative">
                        <img 
                          src={form.logo_url} 
                          alt="Logo preview" 
                          className="w-20 h-20 object-cover rounded-full border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          aria-label="Remove logo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-[#2563EB] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploading}
                          data-testid="seller-logo-upload"
                        />
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload size={20} className="text-gray-400" />
                        )}
                      </label>
                    )}
                    <div className="text-sm text-gray-500">
                      <p>Upload company logo</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="John Doe"
                      required
                      data-testid="seller-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="ABC Textiles"
                      required
                      data-testid="seller-company-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded h-20 resize-none"
                    placeholder="Brief description of the company..."
                    data-testid="seller-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded"
                    placeholder="Mumbai, India"
                    data-testid="seller-location-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="contact@company.com"
                      data-testid="seller-email-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="+91 98765 43210"
                      data-testid="seller-phone-input"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" data-testid="save-seller-btn">
                    {editingSeller ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSellers;
