import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../lib/api";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const emptyForm = { name: "", description: "", image_url: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description,
      image_url: category.image_url,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Please enter category name");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, form);
        toast.success("Category updated");
      } else {
        await createCategory(form);
        toast.success("Category created");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This will not delete associated fabrics.`)) return;
    try {
      await deleteCategory(category.id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-categories-page">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-medium">Categories</h1>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2" data-testid="add-category-btn">
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-neutral-100 animate-pulse">
                <div className="aspect-[4/3] bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-neutral-200 w-2/3" />
                  <div className="h-4 bg-neutral-200 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-100">
            <p className="text-neutral-500 mb-4">No categories yet</p>
            <button onClick={openCreateModal} className="btn-primary">Add First Category</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border border-neutral-100 overflow-hidden" data-testid={`category-card-${category.id}`}>
                <div className="aspect-[4/3] bg-neutral-100">
                  <img
                    src={category.image_url || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg mb-1">{category.name}</h3>
                  <p className="text-neutral-500 text-sm line-clamp-2">{category.description || "No description"}</p>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 btn-secondary text-sm py-2 inline-flex items-center justify-center gap-2"
                      data-testid={`edit-category-${category.id}`}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="flex-1 btn-secondary text-sm py-2 inline-flex items-center justify-center gap-2 hover:border-red-500 hover:text-red-500"
                      data-testid={`delete-category-${category.id}`}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="category-modal">
            <div className="bg-white w-full max-w-md">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-serif font-medium">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-neutral-500 hover:text-neutral-900" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                    placeholder="e.g., Cotton Fabrics"
                    required
                    data-testid="category-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-sm h-24 resize-none"
                    placeholder="Brief description of this category"
                    data-testid="category-description-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-sm"
                    placeholder="https://..."
                    data-testid="category-image-input"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" data-testid="save-category-btn">
                    {editingCategory ? "Update" : "Create"}
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

export default AdminCategories;
