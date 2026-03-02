import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Upload, Check, Video, Package, DollarSign, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { getFabrics, getCategories, getSellers, getArticles, createFabric, updateFabric, deleteFabric, uploadToCloudinary, uploadVideoToCloudinary } from "../../lib/api";

const AdminFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [filteredFabrics, setFilteredFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  const emptyComposition = [
    { material: "", percentage: 0 },
    { material: "", percentage: 0 },
    { material: "", percentage: 0 },
  ];

  const emptyForm = {
    name: "",
    category_id: "",
    seller_id: "",
    article_id: "",
    fabric_type: "woven",
    pattern: "Solid",
    composition: emptyComposition,
    gsm: "",
    ounce: "",
    weight_unit: "gsm",
    width: "",
    // Count fields for non-polyester (ply/count format)
    warp_ply: "1",
    warp_count: "",
    weft_ply: "1",
    weft_count: "",
    yarn_count: "",
    // Denier for polyester
    denier: "",
    color: "",
    finish: "",
    moq: "",
    starting_price: "",
    availability: [],
    stock_type: "ready_stock", // ready_stock or made_to_order
    description: "",
    tags: "",
    images: [],
    videos: [],
    // Inventory fields
    quantity_available: "",
    rate_per_meter: "",
    dispatch_timeline: "",
    is_bookable: false,
    // Pricing fields
    sample_price: "",
    pricing_tiers: [
      { min_qty: 0, max_qty: 100, price: "" },
      { min_qty: 101, max_qty: 500, price: "" },
      { min_qty: 501, max_qty: 1000, price: "" },
      { min_qty: 1001, max_qty: 2500, price: "" },
      { min_qty: 2501, max_qty: 5000, price: "" },
      { min_qty: 5001, max_qty: 10000, price: "" },
    ],
    // Denim fields
    weft_shrinkage: "",
    stretch_percentage: "",
    // Seller SKU
    seller_sku: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fabricTypes = ["woven", "knitted", "non-woven"];
  const patternOptions = ["Solid", "Print", "Stripes", "Checks", "Floral", "Geometric", "Digital", "Random", "Others"];
  const finishOptions = ["", "Bio", "Double Bio", "Silicon", "Double Silicon", "Enzyme Wash", "Sulphur Wash", "Acid Wash", "Normal Wash", "Stone Wash"];
  
  // Standard fabric/dye colors
  const colorOptions = [
    "", "White", "Off-White", "Cream", "Ivory", "Beige", "Tan", "Brown", "Dark Brown", "Chocolate",
    "Black", "Charcoal", "Grey", "Light Grey", "Silver",
    "Red", "Maroon", "Burgundy", "Wine", "Coral", "Salmon", "Pink", "Hot Pink", "Magenta", "Fuchsia",
    "Orange", "Peach", "Rust", "Terracotta",
    "Yellow", "Gold", "Mustard", "Lemon", "Butter",
    "Green", "Olive", "Khaki", "Mint", "Sage", "Forest Green", "Hunter Green", "Lime", "Teal",
    "Blue", "Navy", "Royal Blue", "Sky Blue", "Baby Blue", "Cobalt", "Indigo", "Denim",
    "Purple", "Lavender", "Violet", "Plum", "Mauve", "Lilac",
    "Multi-Color", "Melange", "Heather", "Natural", "Raw", "Undyed"
  ];

  // Dropdown options
  const plyOptions = [1, 2]; // Ply can be 1 or 2
  const yarnCountOptions = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100 for yarn count
  const denierOptions = Array.from({ length: 200 }, (_, i) => i + 1); // 1-200 for denier
  const ounceOptions = Array.from({ length: 77 }, (_, i) => (1 + i * 0.25).toFixed(2)).map(v => parseFloat(v)); // 1-20 in 0.25 increments
  const percentageOptions = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100
  const gsmOptions = Array.from({ length: 500 }, (_, i) => i + 1); // 1-500 for GSM (fabrics can be 200-400+ GSM)
  const widthOptions = Array.from({ length: 100 }, (_, i) => i + 1); // 1-100 for width in inches

  const availabilityOptions = [
    { value: "Sample", label: "Sample Available", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "Bulk", label: "Bulk Available", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "On Request", label: "On Request", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ];

  // Check if composition contains polyester
  const isPolyester = () => {
    return form.composition.some(comp => 
      comp.material && comp.material.toLowerCase().includes('polyester')
    );
  };

  const toggleAvailability = (value) => {
    if (form.availability.includes(value)) {
      setForm({ ...form, availability: form.availability.filter(v => v !== value) });
    } else {
      setForm({ ...form, availability: [...form.availability, value] });
    }
  };

  const updatePricingTier = (index, field, value) => {
    const newTiers = [...form.pricing_tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setForm({ ...form, pricing_tiers: newTiers });
  };

  const addPricingTier = () => {
    const lastTier = form.pricing_tiers[form.pricing_tiers.length - 1];
    const newMinQty = lastTier ? (parseInt(lastTier.max_qty) || 0) + 1 : 0;
    setForm({
      ...form,
      pricing_tiers: [...form.pricing_tiers, { min_qty: newMinQty, max_qty: newMinQty + 999, price: "" }]
    });
  };

  const removePricingTier = (index) => {
    if (form.pricing_tiers.length > 1) {
      setForm({
        ...form,
        pricing_tiers: form.pricing_tiers.filter((_, i) => i !== index)
      });
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

  // Filter fabrics when search or filters change
  useEffect(() => {
    let result = [...fabrics];
    
    // Text search - search in name, composition, tags, seller company, category
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fabric => {
        const nameMatch = fabric.name?.toLowerCase().includes(query);
        const compositionMatch = Array.isArray(fabric.composition) 
          ? fabric.composition.some(c => c.material?.toLowerCase().includes(query))
          : fabric.composition?.toLowerCase().includes(query);
        const tagsMatch = Array.isArray(fabric.tags) && fabric.tags.some(t => t.toLowerCase().includes(query));
        const sellerMatch = fabric.seller_company?.toLowerCase().includes(query);
        const categoryMatch = fabric.category_name?.toLowerCase().includes(query);
        const colorMatch = fabric.color?.toLowerCase().includes(query);
        const skuMatch = fabric.seller_sku?.toLowerCase().includes(query);
        const codeMatch = fabric.fabric_code?.toLowerCase().includes(query);
        
        return nameMatch || compositionMatch || tagsMatch || sellerMatch || categoryMatch || colorMatch || skuMatch || codeMatch;
      });
    }
    
    // Category filter
    if (filterCategory) {
      result = result.filter(fabric => fabric.category_id === filterCategory);
    }
    
    // Seller filter
    if (filterSeller) {
      result = result.filter(fabric => fabric.seller_id === filterSeller);
    }
    
    // Availability filter
    if (filterAvailability) {
      result = result.filter(fabric => 
        Array.isArray(fabric.availability) && fabric.availability.includes(filterAvailability)
      );
    }
    
    setFilteredFabrics(result);
  }, [fabrics, searchQuery, filterCategory, filterSeller, filterAvailability]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("");
    setFilterSeller("");
    setFilterAvailability("");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fabRes, catRes, selRes, artRes] = await Promise.all([
        getFabrics({ limit: 1000 }), // Load all fabrics for admin
        getCategories(), 
        getSellers(true), 
        getArticles()
      ]);
      setFabrics(fabRes.data);
      setCategories(catRes.data);
      setSellers(selRes.data);
      setArticles(artRes.data);
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
      const uploadPromises = files.map((file) => uploadToCloudinary(file, "fabrics"));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((res) => res.data.url);
      setForm({ ...form, images: [...form.images, ...urls] });
      toast.success("Images uploaded to cloud storage");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload images");
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (150MB max)
    const maxSize = 150 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Video file too large. Maximum size is 150MB");
      return;
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid video format. Allowed: MP4, WebM, MOV, AVI, MPEG");
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(0);
    
    try {
      const result = await uploadVideoToCloudinary(file, "fabrics", (progress) => {
        setVideoUploadProgress(progress);
      });
      setForm({ ...form, videos: [...form.videos, result.data.url] });
      toast.success("Video uploaded to cloud storage!");
    } catch (err) {
      console.error("Video upload error:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/admin/login";
      } else {
        toast.error(err.message || "Failed to upload video");
      }
    }
    setUploadingVideo(false);
    setVideoUploadProgress(0);
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
    setSelectedCategory(categories[0]?.id || "");
    setShowModal(true);
  };

  const openEditModal = (fabric) => {
    setEditingFabric(fabric);
    setSelectedCategory(fabric.category_id || "");
    
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
      article_id: fabric.article_id || "",
      pattern: fabric.pattern || "Solid",
      composition: compositionData,
      gsm: fabric.gsm ? fabric.gsm.toString() : "",
      ounce: fabric.ounce || "",
      weight_unit: fabric.weight_unit || "gsm",
      starting_price: fabric.starting_price || "",
      // Parse warp_count from ply/count format (e.g., "2/40" -> ply=2, count=40)
      warp_ply: fabric.warp_count?.includes('/') ? fabric.warp_count.split('/')[0] : "1",
      warp_count: fabric.warp_count?.includes('/') ? fabric.warp_count.split('/')[1] : (fabric.warp_count || ""),
      weft_ply: fabric.weft_count?.includes('/') ? fabric.weft_count.split('/')[0] : "1",
      weft_count: fabric.weft_count?.includes('/') ? fabric.weft_count.split('/')[1] : (fabric.weft_count || ""),
      yarn_count: fabric.yarn_count || "",
      denier: fabric.denier ? fabric.denier.toString() : "",
      color: fabric.color || "",
      finish: fabric.finish || "",
      availability: Array.isArray(fabric.availability) ? fabric.availability : [],
      tags: Array.isArray(fabric.tags) ? fabric.tags.join(", ") : "",
      videos: Array.isArray(fabric.videos) ? fabric.videos : [],
      // Inventory fields
      quantity_available: fabric.quantity_available ? fabric.quantity_available.toString() : "",
      rate_per_meter: fabric.rate_per_meter ? fabric.rate_per_meter.toString() : "",
      dispatch_timeline: fabric.dispatch_timeline || "",
      is_bookable: fabric.is_bookable || false,
      // Pricing fields
      sample_price: fabric.sample_price ? fabric.sample_price.toString() : "",
      pricing_tiers: fabric.pricing_tiers && fabric.pricing_tiers.length > 0 
        ? fabric.pricing_tiers.map(t => ({
            min_qty: t.min_qty || 0,
            max_qty: t.max_qty || 0,
            price: t.price_per_meter ? t.price_per_meter.toString() : ""
          }))
        : [
            { min_qty: 0, max_qty: 100, price: "" },
            { min_qty: 101, max_qty: 500, price: "" },
            { min_qty: 501, max_qty: 1000, price: "" },
            { min_qty: 1001, max_qty: 2500, price: "" },
            { min_qty: 2501, max_qty: 5000, price: "" },
            { min_qty: 5001, max_qty: 10000, price: "" },
          ],
      // Denim fields
      weft_shrinkage: fabric.weft_shrinkage ? fabric.weft_shrinkage.toString() : "",
      stretch_percentage: fabric.stretch_percentage ? fabric.stretch_percentage.toString() : "",
      seller_sku: fabric.seller_sku || "",
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
    
    if (!form.name || !form.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate weight - either GSM or Ounce required based on weight_unit
    if (form.weight_unit === "gsm" && !form.gsm) {
      toast.error("Please enter GSM value");
      return;
    }
    if (form.weight_unit === "ounce" && !form.ounce) {
      toast.error("Please enter Ounce value");
      return;
    }

    // Filter out empty composition entries
    const cleanComposition = form.composition.filter(c => c.material && c.percentage > 0);
    
    // Check if polyester composition
    const hasPolyester = cleanComposition.some(comp => 
      comp.material && comp.material.toLowerCase().includes('polyester')
    );

    // Validate count fields
    if (hasPolyester) {
      if (!form.denier) {
        toast.error("Please enter Denier value for polyester fabric");
        return;
      }
    } else {
      if (!form.warp_count && !form.weft_count) {
        toast.error("Please enter at least Warp Count or Weft Count");
        return;
      }
    }

    // Build warp_count and weft_count in ply/count format
    const warpCountFormatted = form.warp_count ? `${form.warp_ply}/${form.warp_count}` : "";
    const weftCountFormatted = form.weft_count ? `${form.weft_ply}/${form.weft_count}` : "";

    const payload = {
      ...form,
      gsm: form.gsm ? parseInt(form.gsm) : null,
      warp_count: warpCountFormatted,
      weft_count: weftCountFormatted,
      yarn_count: form.yarn_count,
      denier: hasPolyester && form.denier ? parseInt(form.denier) : null,
      composition: cleanComposition,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      videos: form.videos || [],
      // Inventory fields
      quantity_available: form.quantity_available ? parseInt(form.quantity_available) : null,
      rate_per_meter: form.rate_per_meter ? parseFloat(form.rate_per_meter) : null,
      dispatch_timeline: form.dispatch_timeline,
      is_bookable: form.is_bookable,
      // Pricing fields
      sample_price: form.sample_price ? parseFloat(form.sample_price) : null,
      pricing_tiers: form.pricing_tiers
        .filter(t => t.price && t.price !== "")
        .map(t => ({
          min_qty: parseInt(t.min_qty) || 0,
          max_qty: parseInt(t.max_qty) || 0,
          price_per_meter: parseFloat(t.price) || 0
        })),
      // Denim fields
      weft_shrinkage: form.weft_shrinkage ? parseFloat(form.weft_shrinkage) : null,
      stretch_percentage: form.stretch_percentage ? parseFloat(form.stretch_percentage) : null,
      seller_sku: form.seller_sku,
      article_id: form.article_id,
    };
    
    // Remove frontend-only fields
    delete payload.warp_ply;
    delete payload.weft_ply;

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold">Fabrics</h1>
          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2" data-testid="add-fabric-btn">
            <Plus size={18} />
            Add Fabric
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6" data-testid="fabric-search-filters">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fabrics by name, composition, color, seller, SKU..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="fabric-search-input"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              data-testid="filter-category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Seller Filter */}
            <select
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              data-testid="filter-seller"
            >
              <option value="">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.company_name}</option>
              ))}
            </select>

            {/* Availability Filter */}
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
              data-testid="filter-availability"
            >
              <option value="">All Availability</option>
              <option value="Sample">Sample Available</option>
              <option value="Bulk">Bulk Available</option>
              <option value="On Request">On Request</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || filterCategory || filterSeller || filterAvailability) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="clear-filters-btn"
              >
                Clear all
              </button>
            )}

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-500">
              Showing {filteredFabrics.length} of {fabrics.length} fabrics
            </div>
          </div>
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
        ) : filteredFabrics.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded">
            {fabrics.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">No fabrics yet</p>
                <button onClick={openCreateModal} className="btn-primary">Add First Fabric</button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No fabrics match your search criteria</p>
                <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
              </>
            )}
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
                {filteredFabrics.map((fabric) => (
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
                      onChange={(e) => {
                        setForm({ ...form, category_id: e.target.value });
                        setSelectedCategory(e.target.value);
                      }}
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
                    <label className="block text-sm font-medium mb-2">Pattern</label>
                    <select
                      value={form.pattern}
                      onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-pattern-select"
                    >
                      {patternOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weight: GSM or Ounce */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight Unit *</label>
                    <select
                      value={form.weight_unit}
                      onChange={(e) => setForm({ ...form, weight_unit: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-weight-unit-select"
                    >
                      <option value="gsm">GSM</option>
                      <option value="ounce">Ounce</option>
                    </select>
                  </div>
                  {form.weight_unit === "gsm" ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">GSM *</label>
                      <select
                        value={form.gsm}
                        onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                        data-testid="fabric-gsm-select"
                      >
                        <option value="">-- Select GSM --</option>
                        {gsmOptions.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">Ounce *</label>
                      <select
                        value={form.ounce}
                        onChange={(e) => setForm({ ...form, ounce: e.target.value })}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                        data-testid="fabric-ounce-select"
                      >
                        <option value="">-- Select Ounce --</option>
                        {ounceOptions.map((n) => (
                          <option key={n} value={n}>{n} oz</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Composition Editor */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Composition (up to 3 materials)
                    <span className={`ml-2 text-xs ${getCompositionTotal() === 100 ? 'text-emerald-600' : getCompositionTotal() > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      Total: {getCompositionTotal()}%
                    </span>
                  </label>
                  <div className="space-y-2" data-testid="fabric-composition-editor">
                    {form.composition.map((comp, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={comp.material}
                          onChange={(e) => updateComposition(idx, 'material', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
                          placeholder={`Material ${idx + 1} (e.g., Cotton)`}
                          data-testid={`composition-material-${idx}`}
                        />
                        <select
                          value={comp.percentage || ''}
                          onChange={(e) => updateComposition(idx, 'percentage', e.target.value)}
                          className="w-24 px-2 py-2 border border-gray-200 rounded text-sm bg-white"
                          data-testid={`composition-percentage-${idx}`}
                        >
                          <option value="">%</option>
                          {percentageOptions.map((n) => (
                            <option key={n} value={n}>{n}%</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">E.g., Cotton 78%, Polyester 21%, Spandex 1%</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (inches)</label>
                    <select
                      value={form.width}
                      onChange={(e) => setForm({ ...form, width: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-width-select"
                    >
                      <option value="">-- Select Width --</option>
                      {widthOptions.map((n) => (
                        <option key={n} value={n}>{n}"</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Count Fields - Conditional based on composition */}
                {!isPolyester() ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Warp Count (Ply/Count) */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Warp Count {!form.weft_count && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={form.warp_ply}
                            onChange={(e) => setForm({ ...form, warp_ply: e.target.value })}
                            className="w-20 px-3 py-2 border border-neutral-200 rounded-sm bg-white"
                            data-testid="fabric-warp-ply"
                          >
                            {plyOptions.map((n) => (
                              <option key={n} value={n}>{n} ply</option>
                            ))}
                          </select>
                          <span className="flex items-center text-gray-400">/</span>
                          <select
                            value={form.warp_count}
                            onChange={(e) => setForm({ ...form, warp_count: e.target.value })}
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-sm bg-white"
                            data-testid="fabric-warp-count"
                          >
                            <option value="">-- Count --</option>
                            {yarnCountOptions.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Weft Count (Ply/Count) */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Weft Count {!form.warp_count && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={form.weft_ply}
                            onChange={(e) => setForm({ ...form, weft_ply: e.target.value })}
                            className="w-20 px-3 py-2 border border-neutral-200 rounded-sm bg-white"
                            data-testid="fabric-weft-ply"
                          >
                            {plyOptions.map((n) => (
                              <option key={n} value={n}>{n} ply</option>
                            ))}
                          </select>
                          <span className="flex items-center text-gray-400">/</span>
                          <select
                            value={form.weft_count}
                            onChange={(e) => setForm({ ...form, weft_count: e.target.value })}
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-sm bg-white"
                            data-testid="fabric-weft-count"
                          >
                            <option value="">-- Count --</option>
                            {yarnCountOptions.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 -mt-3">
                      Format: Ply/Count (e.g., 2/40 means 2-ply, 40 count). At least one of Warp or Weft count is required.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Denier <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.denier}
                          onChange={(e) => setForm({ ...form, denier: e.target.value })}
                          className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                          data-testid="fabric-denier"
                        >
                          <option value="">-- Select Denier --</option>
                          {denierOptions.map((n) => (
                            <option key={n} value={n}>{n}D</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Denier value for polyester fabrics (1-200)</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Shrinkage & Stretch Fields - Available for all fabrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weft Shrinkage (%)</label>
                    <select
                      value={form.weft_shrinkage}
                      onChange={(e) => setForm({ ...form, weft_shrinkage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded bg-white"
                      data-testid="fabric-weft-shrinkage-select"
                    >
                      <option value="">-- Select --</option>
                      {percentageOptions.map((n) => (
                        <option key={n} value={n}>{n}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stretch (%)</label>
                    <select
                      value={form.stretch_percentage}
                      onChange={(e) => setForm({ ...form, stretch_percentage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded bg-white"
                      data-testid="fabric-stretch-select"
                    >
                      <option value="">-- Select --</option>
                      {percentageOptions.map((n) => (
                        <option key={n} value={n}>{n}%</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <select
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-color-select"
                    >
                      {colorOptions.map((c) => (
                        <option key={c} value={c}>{c || "-- Select Color --"}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Finish</label>
                    <select
                      value={form.finish}
                      onChange={(e) => setForm({ ...form, finish: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-sm bg-white"
                      data-testid="fabric-finish-select"
                    >
                      {finishOptions.map((f) => (
                        <option key={f} value={f}>{f || "-- Select Finish --"}</option>
                      ))}
                    </select>
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
                    <label className="block text-sm font-medium mb-2">Starting Price</label>
                    <input
                      type="text"
                      value={form.starting_price}
                      onChange={(e) => setForm({ ...form, starting_price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded"
                      placeholder="e.g., ₹150/meter or On enquiry"
                      data-testid="fabric-starting-price-input"
                    />
                  </div>
                </div>

                {/* Inventory Section for Bookable Fabrics */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-emerald-700" />
                      <label className="text-sm font-medium text-emerald-800">Inventory & Booking</label>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_bookable}
                        onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })}
                        className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        data-testid="fabric-is-bookable-checkbox"
                      />
                      <span className="text-sm text-emerald-700 font-medium">Enable direct booking</span>
                    </label>
                  </div>
                  
                  {/* Basic Inventory Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity Available (meters)</label>
                      <input
                        type="number"
                        value={form.quantity_available}
                        onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                        className="w-full px-4 py-2 border border-emerald-200 rounded bg-white"
                        placeholder="e.g., 1000"
                        data-testid="fabric-quantity-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Base Rate per meter (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.rate_per_meter}
                        onChange={(e) => setForm({ ...form, rate_per_meter: e.target.value })}
                        className="w-full px-4 py-2 border border-emerald-200 rounded bg-white"
                        placeholder="e.g., 150.00"
                        data-testid="fabric-rate-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Dispatch Timeline</label>
                      <input
                        type="text"
                        value={form.dispatch_timeline}
                        onChange={(e) => setForm({ ...form, dispatch_timeline: e.target.value })}
                        className="w-full px-4 py-2 border border-emerald-200 rounded bg-white"
                        placeholder="e.g., 7-10 days"
                        data-testid="fabric-dispatch-input"
                      />
                    </div>
                  </div>

                  {/* Sample Pricing */}
                  <div className="bg-white rounded p-3 mb-4 border border-emerald-200">
                    <label className="block text-sm font-medium text-emerald-800 mb-2">Sample Pricing (1-5 meters)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Price per meter for samples:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={form.sample_price}
                          onChange={(e) => setForm({ ...form, sample_price: e.target.value })}
                          className="w-28 px-3 py-1.5 border border-emerald-200 rounded bg-white text-sm"
                          placeholder="e.g., 200"
                          data-testid="fabric-sample-price-input"
                        />
                        <span className="text-gray-500">/m</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Customers can order 1-5 meters at this sample rate</p>
                  </div>

                  {/* Bulk Pricing Tiers */}
                  <div className="bg-white rounded p-3 border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-emerald-800">Bulk Pricing Tiers</label>
                      <button
                        type="button"
                        onClick={addPricingTier}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add Tier
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.pricing_tiers.map((tier, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 w-8">{index + 1}.</span>
                          <input
                            type="number"
                            value={tier.min_qty}
                            onChange={(e) => updatePricingTier(index, 'min_qty', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm"
                            placeholder="Min"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="number"
                            value={tier.max_qty}
                            onChange={(e) => updatePricingTier(index, 'max_qty', e.target.value)}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm"
                            placeholder="Max"
                          />
                          <span className="text-gray-500">meters @</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={tier.price}
                              onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                              className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm"
                              placeholder="Price/m"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePricingTier(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Remove tier"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Define quantity brackets with different prices per meter. Leave price empty to skip a tier.</p>
                  </div>

                  <p className="text-xs text-emerald-600 mt-3">Enable booking to allow customers to place orders directly with tiered pricing</p>
                </div>

                {/* Seller SKU */}
                <div>
                  <label className="block text-sm font-medium mb-2">Seller SKU / Serial Number</label>
                  <input
                    type="text"
                    value={form.seller_sku}
                    onChange={(e) => setForm({ ...form, seller_sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded"
                    placeholder="Seller's unique identifier for this fabric"
                    data-testid="fabric-seller-sku-input"
                  />
                </div>

                {/* Article Grouping */}
                <div>
                  <label className="block text-sm font-medium mb-2">Article (Color Variant Group)</label>
                  <select
                    value={form.article_id}
                    onChange={(e) => setForm({ ...form, article_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded bg-white"
                    data-testid="fabric-article-select"
                  >
                    <option value="">No article (standalone fabric)</option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>{article.name} ({article.article_code})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Link this fabric to an article to group color variants together</p>
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

                {/* Videos */}
                <div>
                  <label className="block text-sm font-medium mb-2">Videos</label>
                  <div className="space-y-2 mb-3" data-testid="fabric-videos-list">
                    {form.videos.map((video, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <Video size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-600 truncate">{video}</span>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          aria-label="Remove video"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Video Upload Progress */}
                  {uploadingVideo && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">Uploading video...</span>
                        <span className="text-sm font-medium text-blue-800">{videoUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <label className={`btn-primary text-sm inline-flex items-center gap-2 cursor-pointer ${uploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload size={16} />
                      {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/mpeg"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={uploadingVideo}
                        data-testid="video-upload-input"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addVideoUrl}
                      className="btn-secondary text-sm inline-flex items-center gap-2"
                      disabled={uploadingVideo}
                      data-testid="add-video-btn"
                    >
                      <Video size={16} />
                      Add URL
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Upload videos up to 150MB (MP4, WebM, MOV) or add external URLs</p>
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
