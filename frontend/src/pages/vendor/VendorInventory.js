import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Search, Package, Loader2 } from "lucide-react";
import VendorLayout from "../../components/vendor/VendorLayout";
import { getVendorFabrics, createVendorFabric, updateVendorFabric, deleteVendorFabric, getVendorCategories } from "../../lib/api";
import { toast } from "sonner";

const VendorInventory = () => {
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    name: "",
    fabric_code: "",
    category_id: "",
    description: "",
    composition: "",
    gsm: "",
    ounce: "",
    width: "",
    finish: "",
    tags: "",
    images: [],
    is_bookable: false,
    quantity_available: 0,
    rate_per_meter: 0,
    sample_price: 0,
    moq: "",
    dispatch_timeline: ""
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fabRes, catRes] = await Promise.all([
        getVendorFabrics(),
        getVendorCategories()
      ]);
      setFabrics(fabRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error("Failed to load inventory");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingFabric(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (fabric) => {
    setEditingFabric(fabric);
    setForm({
      name: fabric.name || "",
      fabric_code: fabric.fabric_code || "",
      category_id: fabric.category_id || "",
      description: fabric.description || "",
      composition: fabric.composition || "",
      gsm: fabric.gsm || "",
      ounce: fabric.ounce || "",
      width: fabric.width || "",
      finish: fabric.finish || "",
      tags: fabric.tags || "",
      images: fabric.images || [],
      is_bookable: fabric.is_bookable || false,
      quantity_available: fabric.quantity_available || 0,
      rate_per_meter: fabric.rate_per_meter || 0,
      sample_price: fabric.sample_price || 0,
      moq: fabric.moq || "",
      dispatch_timeline: fabric.dispatch_timeline || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const data = {
        ...form,
        gsm: form.gsm ? parseInt(form.gsm) : null,
        ounce: form.ounce || "",
        rate_per_meter: parseFloat(form.rate_per_meter) || 0,
        sample_price: parseFloat(form.sample_price) || null,
        quantity_available: parseInt(form.quantity_available) || 0
      };

      if (editingFabric) {
        await updateVendorFabric(editingFabric.id, data);
        toast.success("Fabric updated");
      } else {
        await createVendorFabric(data);
        toast.success("Fabric added");
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save fabric");
    }
    setSubmitting(false);
  };

  const handleDelete = async (fabric) => {
    if (!window.confirm(`Delete "${fabric.name}"? This cannot be undone.`)) return;
    
    try {
      await deleteVendorFabric(fabric.id);
      toast.success("Fabric deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredFabrics = fabrics.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.fabric_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <VendorLayout>
      <div className="p-8" data-testid="vendor-inventory">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">My Inventory</h1>
            <p className="text-gray-500 mt-1">{fabrics.length} fabrics</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus size={20} />
            Add Fabric
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Fabrics Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : filteredFabrics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? "No fabrics match your search" : "No fabrics yet"}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 text-emerald-600 hover:underline mt-2"
              >
                <Plus size={16} />
                Add your first fabric
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fabric</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSM / Oz</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulk Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFabrics.map((fabric) => (
                  <tr key={fabric.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={fabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100"}
                          alt={fabric.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{fabric.name}</p>
                          <p className="text-sm text-gray-500">{fabric.fabric_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{fabric.category_name || "-"}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {fabric.gsm ? `${fabric.gsm} GSM` : fabric.ounce ? `${fabric.ounce} oz` : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${fabric.quantity_available > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                        {fabric.quantity_available || 0}m
                      </span>
                    </td>
                    <td className="px-4 py-4">₹{fabric.rate_per_meter?.toLocaleString() || 0}/m</td>
                    <td className="px-4 py-4">
                      {fabric.sample_price ? `₹${fabric.sample_price.toLocaleString()}/m` : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        fabric.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        fabric.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        fabric.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {fabric.status === "approved" ? "Live" :
                         fabric.status === "pending" ? "Pending Approval" :
                         fabric.status === "rejected" ? "Rejected" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(fabric)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(fabric)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold">
                  {editingFabric ? "Edit Fabric" : "Add New Fabric"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Code</label>
                    <input
                      type="text"
                      value={form.fabric_code}
                      onChange={(e) => setForm({ ...form, fabric_code: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSM</label>
                    <input
                      type="number"
                      value={form.gsm}
                      onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ounce (oz)</label>
                    <input
                      type="text"
                      value={form.ounce}
                      onChange={(e) => setForm({ ...form, ounce: e.target.value })}
                      placeholder="e.g. 10.5"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="text"
                      value={form.width}
                      onChange={(e) => setForm({ ...form, width: e.target.value })}
                      placeholder='58"'
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
                    <input
                      type="text"
                      value={form.finish}
                      onChange={(e) => setForm({ ...form, finish: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Composition</label>
                  <input
                    type="text"
                    value={form.composition}
                    onChange={(e) => setForm({ ...form, composition: e.target.value })}
                    placeholder="100% Cotton or 60% Cotton, 40% Polyester"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Inventory & Pricing</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock (meters)</label>
                      <input
                        type="number"
                        value={form.quantity_available}
                        onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Price (₹/m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.rate_per_meter}
                        onChange={(e) => setForm({ ...form, rate_per_meter: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sample Price (₹/m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.sample_price}
                        onChange={(e) => setForm({ ...form, sample_price: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* MOQ & Dispatch */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
                    <input
                      type="text"
                      value={form.moq}
                      onChange={(e) => setForm({ ...form, moq: e.target.value })}
                      placeholder="100 meters"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Timeline</label>
                    <input
                      type="text"
                      value={form.dispatch_timeline}
                      onChange={(e) => setForm({ ...form, dispatch_timeline: e.target.value })}
                      placeholder="7-10 days"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_bookable"
                    checked={form.is_bookable}
                    onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="is_bookable" className="text-sm font-medium text-gray-700">
                    Make this fabric available for booking
                  </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingFabric ? "Update Fabric" : "Add Fabric"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorInventory;
