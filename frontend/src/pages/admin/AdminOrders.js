import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Truck, XCircle, Search, RefreshCw, ChevronDown, Mail, Phone, MapPin, DollarSign, Eye, FileText } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { listOrders, updateOrderStatus, getOrderStats, sendOrderConfirmation, downloadInvoice } from "../../lib/api";
import { toast } from "sonner";

const statusConfig = {
  payment_pending: { label: "Payment Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-700", icon: Package },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
  payment_failed: { label: "Payment Failed", color: "bg-red-100 text-red-700", icon: XCircle },
};

const paymentStatusConfig = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  initiated: { label: "Initiated", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", color: "bg-orange-100 text-orange-700" },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await listOrders(params);
      setOrders(res.data.orders || []);
    } catch (err) {
      toast.error("Failed to load orders");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await getOrderStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error("Failed to update status");
    }
    setUpdatingStatus(null);
  };

  const handleResendConfirmation = async (orderId) => {
    try {
      await sendOrderConfirmation(orderId);
      toast.success("Confirmation email sent");
    } catch (err) {
      toast.error("Failed to send email");
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower) ||
      order.customer?.email?.toLowerCase().includes(searchLower) ||
      order.customer?.phone?.includes(search)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <AdminLayout>
      <div className="p-8" data-testid="admin-orders-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="text-gray-500 mt-1">Manage customer orders and track fulfillment</p>
          </div>
          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold">{stats.total_orders}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">Pending Payment</p>
              <p className="text-2xl font-semibold text-yellow-700">{stats.pending_payment}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">Paid</p>
              <p className="text-2xl font-semibold text-green-700">{stats.paid}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">Confirmed</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.confirmed}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">Shipped</p>
              <p className="text-2xl font-semibold text-purple-700">{stats.shipped}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">Delivered</p>
              <p className="text-2xl font-semibold text-emerald-700">{stats.delivered}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-emerald-600">₹{stats.total_revenue?.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search || statusFilter ? "No orders match your filters" : "No orders yet"}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.payment_pending;
                  const paymentInfo = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-blue-600">{order.order_number}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{order.customer?.name}</p>
                        <p className="text-sm text-gray-500">{order.customer?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}m total
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-emerald-600">₹{order.total?.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <div className="relative group">
                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                              <ChevronDown size={18} />
                            </button>
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                              {["confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusUpdate(order.id, status)}
                                  disabled={updatingStatus === order.id}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg capitalize"
                                >
                                  {status === order.status ? `✓ ${status}` : status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Order {selectedOrder.order_number}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                  {statusConfig[selectedOrder.status]?.label}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Customer Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="font-medium">{selectedOrder.customer?.name}</p>
                    {selectedOrder.customer?.company && (
                      <p className="text-gray-600">{selectedOrder.customer.company}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      {selectedOrder.customer?.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      {selectedOrder.customer?.phone}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>
                        {selectedOrder.customer?.address}, {selectedOrder.customer?.city}, {selectedOrder.customer?.state} {selectedOrder.customer?.pincode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-4 flex gap-4">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.fabric_name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.fabric_name}</p>
                          <p className="text-sm text-gray-500">{item.category_name}</p>
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.order_type === "sample" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {item.order_type}
                            </span>
                            <span className="text-gray-600">{item.quantity}m × ₹{item.price_per_meter}/m</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{(item.quantity * item.price_per_meter).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (5%)</span>
                      <span>₹{selectedOrder.tax?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                      <span>Total</span>
                      <span className="text-emerald-600">₹{selectedOrder.total?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${paymentStatusConfig[selectedOrder.payment_status]?.color}`}>
                        {paymentStatusConfig[selectedOrder.payment_status]?.label}
                      </span>
                    </div>
                    {selectedOrder.razorpay_payment_id && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Razorpay ID</span>
                        <span className="font-mono">{selectedOrder.razorpay_payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Customer Notes</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100 flex justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleResendConfirmation(selectedOrder.id)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Mail size={18} />
                    Resend Confirmation
                  </button>
                  {selectedOrder.payment_status === 'paid' && (
                    <a
                      href={downloadInvoice(selectedOrder.order_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      data-testid="admin-download-invoice-btn"
                    >
                      <FileText size={18} />
                      Download Invoice
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
