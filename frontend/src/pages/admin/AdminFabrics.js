import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Upload, Check, Video } from "lucide-react";
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

  const emptyComposition = [
    { material: "", percentage: 0 },
    { material: "", percentage: 0 },
    { material: "", percentage: 0 },
  ];

  const emptyForm = {
    name: "",
    category_id: "",
    seller_id: "",
    fabric_type: "woven",
    pattern: "Solid",
    composition: emptyComposition,
    gsm: "",
    width: "",
    color: "",
    finish: "",
    moq: "",
    starting_price: "",
    availability: [],
    description: "",
    tags: "",
    images: [],
    videos: [],
  };

  const [form, setForm] = useState(emptyForm);

  const fabricTypes = ["woven", "knitted", "non-woven"];
  const patternOptions = ["Solid", "Print", "None"];
  const availabilityOptions = [
    { value: "Sample", label: "Sample Available", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "Bulk", label: "Bulk Available", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "On Request", label: "On Request", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ];

  const toggleAvailability = (value) => {
    if (form.availability.includes(value)) {
      setForm({ ...form, availability: form.availability.filter(v => v !== value) });
    } else {
      setForm({ ...form, availability: [...form.availability, value] });
    }
  };

  const updateComposition = (index, field, value) => {
    const newComp = [...form.composition];
    newComp[index] = { ...newComp[index], [field]: field === 'percentage' ? parseInt(value) || 0 : value };
    setForm({ ...form, composition: newComp });
  };

  const getCompositionTotal = () => {
    return form.composition.reduce((sum, c) => sum + (c.percentage || 0), 0);
  };

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

  const addVideoUrl = () => {
    const url = window.prompt("Enter video URL (YouTube, Vimeo, or direct link):");
    if (url && url.trim()) {
      setForm({ ...form, videos: [...form.videos, url.trim()] });
    }
  };

  const removeVideo = (index) => {
    setForm({ ...form, videos: form.videos.filter((_, i) => i !== index) });
  };

  const openCreateModal = () => {
    setEditingFabric(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id || "", composition: [...emptyComposition] });
    setShowModal(true);
  };

  const openEditModal = (fabric) => {
    setEditingFabric(fabric);
    
    // Parse composition - could be string (legacy) or array (new)
    let compositionData = [...emptyComposition];
    if (Array.isArray(fabric.composition) && fabric.composition.length > 0) {
      compositionData = [
        fabric.composition[0] || { material: "", percentage: 0 },
        fabric.composition[1] || { material: "", percentage: 0 },
        fabric.composition[2] || { material: "", percentage: 0 },
      ];
    } else if (typeof fabric.composition === 'string' && fabric.composition) {
      // Legacy string format - try to parse "100% Cotton" or "65% Poly, 35% Cotton"
      compositionData = [{ material: fabric.composition, percentage: 100 }, { material: "", percentage: 0 }, { material: "", percentage: 0 }];
    }
    
    setForm({
      ...fabric,
      seller_id: fabric.seller_id || "",
      pattern: fabric.pattern || "Solid",
      composition: compositionData,
      starting_price: fabric.starting_price || "",
      availability: Array.isArray(fabric.availability) ? fabric.availability : [],
      gsm: fabric.gsm.toString(),
      tags: Array.isArray(fabric.tags) ? fabric.tags.join(", ") : "",
      videos: Array.isArray(fabric.videos) ? fabric.videos : [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate composition total
    const compositionTotal = getCompositionTotal();
    const hasComposition = form.composition.some(c => c.material && c.percentage > 0);
    if (hasComposition && compositionTotal !== 100) {
      toast.error(`Composition percentages must total 100% (currently ${compositionTotal}%)`);
      return;
    }
    
    if (!form.name || !form.category_id || !form.gsm) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Filter out empty composition entries
    const cleanComposition = form.composition.filter(c => c.material && c.percentage > 0);

    const payload = {
      ...form,
      gsm: parseInt(form.gsm),
      composition: cleanComposition,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      videos: form.videos || [],
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
          <h1 className="text-3xl font-semibold">Fabrics</h1>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2" data-testid="add-fabric-btn">
            <Plus size={18} />
            Add Fabric
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 border border-gray-100 animate-pulse flex gap-4 rounded">
                <div className="w-16 h-16 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 w-1/3 rounded" />
                  <div className="h-4 bg-gray-200 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded">
            <p className="text-gray-500 mb-4">No fabrics yet</p>
            <button onClick={openCreateModal} className="btn-primary">Add First Fabric</button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 overflow-hidden rounded" data-testid="fabrics-table">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Fabric</th>
                  <th className="text-left p-4 font-medium text-sm hidden md:table-cell">Seller</th>
                  <th className="text-left p-4 font-medium text-sm hidden lg:table-cell">Category</th>
                  <th className="text-left p-4 font-medium text-sm hidden lg:table-cell">GSM</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-right p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fabrics.map((fabric) => (
                  <tr key={fabric.id} className="border-b border-gray-100 last:border-0" data-testid={`fabric-row-${fabric.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 overflow-hidden flex-shrink-0 rounded">
                          <img
                            src={fabric.images[0] || "https://via.placeholder.com/48"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{fabric.name}</p>
                          <p className="text-sm text-gray-500">
                            {Array.isArray(fabric.composition) && fabric.composition.length > 0
                              ? fabric.composition.map(c => `${c.percentage}% ${c.material}`).join(', ')
                              : fabric.composition || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {fabric.seller_company ? (
                        <span className="text-gray-700">{fabric.seller_company}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">No seller</span>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-gray-600">{fabric.category_name}</td>
                    <td className="p-4 hidden lg:table-cell font-mono text-sm">{fabric.gsm}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(fabric.availability) ? fabric.availability : []).map((avail, idx) => (
                          <span key={idx} className={`badge ${
                            avail === "Sample" ? "bg-blue-50 text-blue-700" :
                            avail === "Bulk" ? "bg-emerald-50 text-emerald-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {avail}
                          </span>
                        ))}
                        {(!fabric.availability || fabric.availability.length === 0) && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(fabric)}
                        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                        data-testid={`edit-fabric-${fabric.id}`}
                        aria-label="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(fabric)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
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
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingFabric ? "Edit Fabric" : "Add Fabric"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:text-gray-900" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Seller Selection */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded">
                  <label className="block text-sm font-medium mb-2 text-[#2563EB]">Seller / Supplier</label>
                  <select
                    value={form.seller_id}
                    onChange={(e) => setForm({ ...form, seller_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded bg-white"
                    data-testid="fabric-seller-select"
                  >
                    <option value="">No seller (Locofast direct)</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>{seller.company_name} - {seller.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the seller whose collection this fabric belongs to</p>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      required
                      data-testid="fabric-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded bg-white"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">MOQ</label>
                    <input
                      type="text"
                      value={form.moq}
                      onChange={(e) => setForm({ ...form, moq: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
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
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="e.g., On enquiry"
                      data-testid="fabric-price-input"
                    />
                  </div>
                </div>

                {/* Availability Multi-Select */}
                <div>
                  <label className="block text-sm font-medium mb-3">Availability</label>
                  <div className="flex flex-wrap gap-3" data-testid="fabric-availability-options">
                    {availabilityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleAvailability(opt.value)}
                        className={`px-4 py-2 rounded border-2 text-sm font-medium transition-all flex items-center gap-2 ${
                          form.availability.includes(opt.value)
                            ? opt.color + " border-current"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {form.availability.includes(opt.value) && <Check size={16} />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select all that apply</p>
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
