import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { getFabrics, getCategories, getSellers, createFabric, updateFabric, deleteFabric, uploadImage } from "../../lib/api";

const AdminFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [uploading, setUploading] = useState(false);

  const emptyForm = {
    name: "",
    category_id: "",
    seller_id: "",
    fabric_type: "woven",
    composition: "",
    gsm: "",
    width: "",
    color: "",
    finish: "",
    moq: "",
    price_range: "",
    availability: "Available",
    description: "",
    tags: "",
    images: [],
  };

  const [form, setForm] = useState(emptyForm);

  const fabricTypes = ["woven", "knitted", "non-woven"];
  const availabilityOptions = ["Available", "On request", "Sample only"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fabRes, catRes, selRes] = await Promise.all([getFabrics(), getCategories(), getSellers()]);
      setFabrics(fabRes.data);
      setCategories(catRes.data);
      setSellers(selRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((res) => res.data.url);
      setForm({ ...form, images: [...form.images, ...urls] });
      toast.success("Images uploaded");
    } catch (err) {
      toast.error("Failed to upload images");
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const openCreateModal = () => {
    setEditingFabric(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id || "" });
    setShowModal(true);
  };

  const openEditModal = (fabric) => {
    setEditingFabric(fabric);
    setForm({
      ...fabric,
      seller_id: fabric.seller_id || "",
      gsm: fabric.gsm.toString(),
      tags: fabric.tags.join(", "),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.composition || !form.gsm) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      ...form,
      gsm: parseInt(form.gsm),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (editingFabric) {
        await updateFabric(editingFabric.id, payload);
        toast.success("Fabric updated");
      } else {
        await createFabric(payload);
        toast.success("Fabric created");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save fabric");
    }
  };

  const handleDelete = async (fabric) => {
    if (!window.confirm(`Delete "${fabric.name}"?`)) return;
    try {
      await deleteFabric(fabric.id);
      toast.success("Fabric deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete fabric");
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-fabrics-page">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-medium">Fabrics</h1>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2" data-testid="add-fabric-btn">
            <Plus size={18} />
            Add Fabric
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 border border-neutral-100 animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-neutral-200 w-1/3" />
                  <div className="h-4 bg-neutral-200 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-100">
            <p className="text-neutral-500 mb-4">No fabrics yet</p>
            <button onClick={openCreateModal} className="btn-primary">Add First Fabric</button>
          </div>
        ) : (
          <div className="bg-white border border-neutral-100 overflow-hidden" data-testid="fabrics-table">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Fabric</th>
                  <th className="text-left p-4 font-medium text-sm hidden md:table-cell">Category</th>
                  <th className="text-left p-4 font-medium text-sm hidden lg:table-cell">Type</th>
                  <th className="text-left p-4 font-medium text-sm hidden lg:table-cell">GSM</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fabrics.map((fabric) => (
                  <tr key={fabric.id} className="border-b border-neutral-100 last:border-0" data-testid={`fabric-row-${fabric.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-100 overflow-hidden flex-shrink-0">
                          <img
                            src={fabric.images[0] || "https://via.placeholder.com/48"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{fabric.name}</p>
                          <p className="text-sm text-neutral-500">{fabric.composition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-neutral-600">{fabric.category_name}</td>
                    <td className="p-4 hidden lg:table-cell text-neutral-600 capitalize">{fabric.fabric_type}</td>
                    <td className="p-4 hidden lg:table-cell font-mono text-sm">{fabric.gsm}</td>
                    <td className="p-4">
                      <span className={`badge ${
                        fabric.availability === "Available" ? "badge-available" :
                        fabric.availability === "On request" ? "badge-request" : "badge-sample"
                      }`}>
                        {fabric.availability}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(fabric)}
                        className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
                        data-testid={`edit-fabric-${fabric.id}`}
                        aria-label="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(fabric)}
                        className="p-2 text-neutral-500 hover:text-red-600 transition-colors"
                        data-testid={`delete-fabric-${fabric.id}`}
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="fabric-modal">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-serif font-medium">
                  {editingFabric ? "Edit Fabric" : "Add Fabric"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-neutral-500 hover:text-neutral-900" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      required
                      data-testid="fabric-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      required
                      data-testid="fabric-category-select"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Fabric Type *</label>
                    <select
                      value={form.fabric_type}
                      onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-type-select"
                    >
                      {fabricTypes.map((type) => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Composition *</label>
                    <input
                      type="text"
                      value={form.composition}
                      onChange={(e) => setForm({ ...form, composition: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      placeholder="e.g., 100% Cotton"
                      required
                      data-testid="fabric-composition-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GSM *</label>
                    <input
                      type="number"
                      value={form.gsm}
                      onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      required
                      data-testid="fabric-gsm-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Width</label>
                    <input
                      type="text"
                      value={form.width}
                      onChange={(e) => setForm({ ...form, width: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      placeholder="e.g., 58 inches"
                      data-testid="fabric-width-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      data-testid="fabric-color-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Finish</label>
                    <input
                      type="text"
                      value={form.finish}
                      onChange={(e) => setForm({ ...form, finish: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      data-testid="fabric-finish-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">MOQ</label>
                    <input
                      type="text"
                      value={form.moq}
                      onChange={(e) => setForm({ ...form, moq: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      placeholder="e.g., 500 meters"
                      data-testid="fabric-moq-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Range</label>
                    <input
                      type="text"
                      value={form.price_range}
                      onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                      placeholder="e.g., $2.50 - $3.00/m"
                      data-testid="fabric-price-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Availability</label>
                    <select
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-availability-select"
                    >
                      {availabilityOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-sm h-24 resize-none"
                    data-testid="fabric-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                    placeholder="e.g., cotton, lightweight, summer"
                    data-testid="fabric-tags-input"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">Images</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 bg-neutral-100">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          aria-label="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-neutral-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                        data-testid="fabric-image-upload"
                      />
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload size={20} className="text-neutral-400" />
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" data-testid="save-fabric-btn">
                    {editingFabric ? "Update Fabric" : "Create Fabric"}
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

export default AdminFabrics;
