import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAgentAuth } from "../../context/AgentAuthContext";
import { Search, ShoppingCart, Send, Package, LogOut, Plus, Minus, Trash2, ExternalLink, Copy, Loader2, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const API = process.env.REACT_APP_BACKEND_URL;

const AgentDashboardPage = () => {
  const { agent, token, logout } = useAgentAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("catalog"); // catalog | cart | shared | orders

  // Catalog
  const [fabrics, setFabrics] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalFabrics, setTotalFabrics] = useState(0);

  // Cart
  const [cart, setCart] = useState([]);

  // Shared carts
  const [sharedCarts, setSharedCarts] = useState([]);
  const [cartsLoading, setCartsLoading] = useState(false);

  // Agent orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Share modal
  const [sharing, setSharing] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchFabrics = useCallback(async () => {
    setFabricsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20", skip: String((page - 1) * 20), status: "approved" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`${API}/api/fabrics?${params}`);
      const data = await res.json();
      setFabrics(data.fabrics || data || []);
      setTotalFabrics(data.total || data.length || 0);
    } catch {
      toast.error("Failed to load fabrics");
    }
    setFabricsLoading(false);
  }, [page, searchQuery]);

  const fetchSharedCarts = async () => {
    setCartsLoading(true);
    try {
      const res = await fetch(`${API}/api/agent/shared-carts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSharedCarts(await res.json());
    } catch {}
    setCartsLoading(false);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/agent/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(await res.json());
    } catch {}
    setOrdersLoading(false);
  };

  useEffect(() => { fetchFabrics(); }, [fetchFabrics]);
  useEffect(() => { if (activeTab === "shared") fetchSharedCarts(); }, [activeTab]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [activeTab]);

  const addToCart = (fabric) => {
    const existing = cart.find((c) => c.fabric_id === fabric.id);
    if (existing) {
      toast.info("Already in cart — adjust quantity there");
      setActiveTab("cart");
      return;
    }
    setCart([...cart, {
      fabric_id: fabric.id,
      fabric_name: fabric.name,
      fabric_code: fabric.fabric_code || "",
      category_name: fabric.category_name || "",
      seller_company: fabric.seller_company || "",
      seller_id: fabric.seller_id || "",
      quantity: fabric.moq || 100,
      price_per_meter: fabric.rate_per_meter || 0,
      order_type: "bulk",
      image_url: fabric.images?.[0] || "",
      hsn_code: fabric.hsn_code || "",
    }]);
    toast.success(`${fabric.name} added to cart`);
  };

  const updateCartQty = (fabricId, delta) => {
    setCart(cart.map((c) => c.fabric_id === fabricId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeFromCart = (fabricId) => {
    setCart(cart.filter((c) => c.fabric_id !== fabricId));
  };

  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error("Only image files allowed"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/agent/upload-payment-proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setPaymentProofUrl(data.url);
      toast.success("Payment proof uploaded");
    } catch (err) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  const handleShareCart = async () => {
    if (!cart.length) return;
    setSharing(true);
    try {
      const res = await fetch(`${API}/api/agent/shared-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: cart, customer_email: customerEmail, notes: "", payment_proof_url: paymentProofUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      const link = `${window.location.origin}/shared-cart/${data.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Cart shared! Link copied to clipboard.");
      setCart([]);
      setCustomerEmail("");
      setPaymentProofUrl("");
      setActiveTab("shared");
      fetchSharedCarts();
    } catch (err) {
      toast.error(err.message);
    }
    setSharing(false);
  };

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared-cart/${token}`);
    toast.success("Link copied!");
  };

  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.price_per_meter, 0);

  const handleLogout = () => { logout(); navigate("/agent/login"); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-grow pt-20" data-testid="agent-dashboard">
        <div className="container-main py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {agent?.name || agent?.email}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 px-4 py-2 border border-gray-200 rounded-lg hover:border-red-200 transition-colors" data-testid="agent-logout-btn">
              <LogOut size={16} />Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {[
              { key: "catalog", label: "Browse Catalog", icon: Search },
              { key: "cart", label: `Cart (${cart.length})`, icon: ShoppingCart },
              { key: "shared", label: "Shared Carts", icon: Send },
              { key: "orders", label: "Orders", icon: Package },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                data-testid={`agent-tab-${t.key}`}
              >
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>

          {/* ===== CATALOG TAB ===== */}
          {activeTab === "catalog" && (
            <div>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fabrics..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    data-testid="agent-fabric-search"
                  />
                </div>
              </div>
              {fabricsLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-600" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {fabrics.map((f) => (
                    <div key={f.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" data-testid={`agent-fabric-${f.id}`}>
                      <img src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300"} alt={f.name} className="w-full h-40 object-cover" loading="lazy" />
                      <div className="p-4">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{f.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{f.category_name} {f.seller_company ? `· ${f.seller_company}` : ""}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-semibold text-[#2563EB]">₹{f.rate_per_meter?.toLocaleString()}<span className="text-xs font-normal text-gray-500">/m</span></span>
                          <button
                            onClick={() => addToCart(f)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            data-testid={`add-to-cart-${f.id}`}
                          >
                            <Plus size={14} />Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {totalFabrics > 20 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>
                  <span className="text-sm text-gray-500">Page {page}</span>
                  <button disabled={page * 20 >= totalFabrics} onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}

          {/* ===== CART TAB ===== */}
          {activeTab === "cart" && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Cart is empty</p>
                  <p className="text-sm mt-1">Browse the catalog to add fabrics</p>
                  <button onClick={() => setActiveTab("catalog")} className="mt-4 px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-blue-700">Browse Catalog</button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    {cart.map((item) => (
                      <div key={item.fabric_id} className="bg-white rounded-xl p-4 border border-gray-200 flex gap-4" data-testid={`cart-item-${item.fabric_id}`}>
                        {item.image_url && <img src={item.image_url} alt={item.fabric_name} className="w-20 h-20 object-cover rounded-lg" />}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.fabric_name}</h3>
                          <p className="text-xs text-gray-500">{item.category_name}{item.seller_company ? ` · ${item.seller_company}` : ""}</p>
                          <p className="text-sm text-[#2563EB] font-semibold mt-1">₹{item.price_per_meter}/m</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => removeFromCart(item.fabric_id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                            <button onClick={() => updateCartQty(item.fabric_id, -10)} className="p-1 text-gray-500 hover:text-gray-700"><Minus size={14} /></button>
                            <span className="text-sm font-medium w-12 text-center">{item.quantity}m</span>
                            <button onClick={() => updateCartQty(item.fabric_id, 10)} className="p-1 text-gray-500 hover:text-gray-700"><Plus size={14} /></button>
                          </div>
                          <span className="text-sm font-semibold">₹{(item.quantity * item.price_per_meter).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 h-fit sticky top-24">
                    <h3 className="font-semibold text-gray-900 mb-4">Share Cart</h3>
                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-gray-600">Items</span><span>{cart.length}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Cart Total</span><span className="font-semibold text-[#2563EB]">₹{cartTotal.toLocaleString()}</span></div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Customer Email (optional)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                        data-testid="agent-customer-email"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">RTGS/NEFT Payment Proof</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                        {paymentProofUrl ? (
                          <div className="flex items-center gap-3">
                            <img src={`${API}${paymentProofUrl}`} alt="Payment proof" className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1 text-left">
                              <p className="text-xs text-emerald-600 font-medium">Uploaded</p>
                              <button onClick={() => setPaymentProofUrl("")} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleUploadProof} className="hidden" data-testid="agent-payment-proof-input" />
                            <p className="text-xs text-gray-500">{uploading ? "Uploading..." : "Click to upload screenshot"}</p>
                          </label>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleShareCart}
                      disabled={sharing || !cart.length}
                      className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      data-testid="agent-share-cart-btn"
                    >
                      {sharing ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} />Generate & Copy Link</>}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">Link will be copied to clipboard. Share it with the customer for payment.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SHARED CARTS TAB ===== */}
          {activeTab === "shared" && (
            <div>
              {cartsLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-600" /></div>
              ) : sharedCarts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Send size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No shared carts yet</p>
                  <p className="text-sm mt-1">Build a cart and share the link with a customer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedCarts.map((sc) => (
                    <div key={sc.id} className="bg-white rounded-xl p-5 border border-gray-200" data-testid={`shared-cart-${sc.token}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {sc.status === "completed" ? <CheckCircle size={18} className="text-emerald-500" /> : sc.status === "expired" ? <XCircle size={18} className="text-red-400" /> : <Clock size={18} className="text-amber-500" />}
                          <div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.status === "completed" ? "bg-emerald-100 text-emerald-700" : sc.status === "expired" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {sc.status === "completed" ? "Completed" : sc.status === "expired" ? "Expired" : "Pending"}
                            </span>
                            <span className="text-xs text-gray-400 ml-3">{formatDate(sc.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => copyLink(sc.token)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] border border-blue-200 rounded-lg hover:bg-blue-50"><Copy size={14} />Copy Link</button>
                          <a href={`/shared-cart/${sc.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><ExternalLink size={14} />Open</a>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{sc.items?.length || 0} item{(sc.items?.length || 0) !== 1 ? "s" : ""}</span>
                        {sc.customer_email && <span className="ml-3 text-gray-400">Customer: {sc.customer_email}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sc.items?.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded">{item.fabric_name} ({item.quantity}m)</span>
                        ))}
                        {sc.items?.length > 3 && <span className="text-xs text-gray-400">+{sc.items.length - 3} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === "orders" && (
            <div>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-600" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm mt-1">Orders placed via your shared carts will appear here</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 font-medium text-[#2563EB]">{o.order_number}</td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium">{o.customer?.name}</p>
                            <p className="text-xs text-gray-500">{o.customer?.email}</p>
                          </td>
                          <td className="px-4 py-4 font-semibold text-emerald-600">₹{o.total?.toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.status === "confirmed" || o.status === "delivered" ? "bg-emerald-100 text-emerald-700" : o.status === "shipped" ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">{formatDate(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgentDashboardPage;
