import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Truck, CreditCard, CheckCircle2, AlertCircle, Loader2, Package } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFabric, createOrder, verifyPayment, sendOrderConfirmation } from "../lib/api";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get params from URL
  const fabricId = searchParams.get("fabric_id");
  const orderType = searchParams.get("type") || "bulk"; // sample or bulk
  const quantity = parseInt(searchParams.get("qty") || "1");
  
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // Customer form
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [notes, setNotes] = useState("");
  
  // Shipping
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  
  // Pricing
  const [pricePerMeter, setPricePerMeter] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!fabricId) {
      toast.error("No fabric selected");
      navigate("/fabrics");
      return;
    }
    
    fetchFabric();
  }, [fabricId]);

  useEffect(() => {
    if (fabric) {
      calculatePricing();
    }
  }, [fabric, quantity, orderType, shippingCost]);

  // Fetch shipping rates when pincode changes
  useEffect(() => {
    if (customer.pincode && customer.pincode.length === 6) {
      fetchShippingRates();
    } else {
      setShippingRates([]);
      setSelectedShipping(null);
      setShippingCost(0);
    }
  }, [customer.pincode]);

  const fetchShippingRates = async () => {
    setLoadingShipping(true);
    setShippingError(null);
    
    try {
      // Calculate weight based on quantity (assume 0.3kg per meter)
      const weightKg = Math.max(0.5, quantity * 0.3);
      const declaredValue = subtotal || 1000;
      
      const response = await axios.get(`${API_URL}/api/shipping/rates`, {
        params: {
          pickup_pincode: "110019", // Primary pickup location
          delivery_pincode: customer.pincode,
          weight_kg: weightKg,
          declared_value: declaredValue,
          cod: false
        }
      });
      
      if (response.data.success && response.data.couriers.length > 0) {
        setShippingRates(response.data.couriers);
        // Auto-select cheapest option
        const cheapest = response.data.couriers[0];
        setSelectedShipping(cheapest);
        setShippingCost(cheapest.rate);
      } else {
        setShippingRates([]);
        setShippingError("No shipping options available for this pincode");
      }
    } catch (err) {
      console.error("Error fetching shipping rates:", err);
      setShippingError("Unable to fetch shipping rates. Please try again.");
    }
    setLoadingShipping(false);
  };

  const fetchFabric = async () => {
    try {
      const res = await getFabric(fabricId);
      setFabric(res.data);
    } catch (err) {
      toast.error("Failed to load fabric details");
      navigate("/fabrics");
    }
    setLoading(false);
  };

  const calculatePricing = () => {
    if (!fabric) return;
    
    let price = 0;
    
    if (orderType === "sample") {
      price = fabric.sample_price || fabric.rate_per_meter || 0;
    } else {
      // Find applicable tier
      const tiers = fabric.pricing_tiers || [];
      for (const tier of tiers) {
        if (quantity >= tier.min_qty && quantity <= tier.max_qty) {
          price = tier.price_per_meter;
          break;
        }
      }
      if (!price) {
        price = fabric.rate_per_meter || 0;
      }
    }
    
    const sub = price * quantity;
    const taxAmount = sub * 0.05; // 5% GST
    
    setPricePerMeter(price);
    setSubtotal(sub);
    setTax(taxAmount);
    setTotal(sub + taxAmount + shippingCost);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create order
      const orderData = {
        items: [{
          fabric_id: fabric.id,
          fabric_name: fabric.name,
          fabric_code: fabric.fabric_code || "",
          category_name: fabric.category_name || "",
          seller_company: fabric.seller_company || "",
          quantity: quantity,
          price_per_meter: pricePerMeter,
          order_type: orderType,
          image_url: fabric.images?.[0] || ""
        }],
        customer: customer,
        notes: notes
      };

      const response = await createOrder(orderData);
      const orderInfo = response.data;

      // Open Razorpay checkout
      const options = {
        key: orderInfo.razorpay_key_id || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderInfo.amount_paise,
        currency: orderInfo.currency,
        name: "Locofast",
        description: `${orderType === "sample" ? "Sample" : "Bulk"} Order - ${fabric.name}`,
        order_id: orderInfo.razorpay_order_id,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              // Send confirmation email (best effort)
              try {
                await sendOrderConfirmation(orderInfo.order_id);
              } catch (emailErr) {
                console.warn("Email sending failed:", emailErr);
              }
              
              // Redirect to confirmation page
              toast.success("Payment successful!");
              navigate(`/order-confirmation/${orderInfo.order_number}`);
            }
          } catch (err) {
            setPaymentError("Payment verification failed. Please contact support.");
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        notes: {
          order_id: orderInfo.order_id,
          fabric_name: fabric.name
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function() {
            setSubmitting(false);
            toast.info("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        setPaymentError(response.error.description || "Payment failed");
        setSubmitting(false);
      });
      razorpay.open();

    } catch (err) {
      console.error("Checkout error:", err);
      setPaymentError(err.response?.data?.detail || "Failed to initiate payment");
      toast.error("Failed to initiate payment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  if (!fabric) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-grow pt-20" data-testid="checkout-page">
        <div className="container-main py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Summary Card */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Order Summary
                  </h2>
                  
                  <div className="flex gap-4">
                    <img
                      src={fabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200"}
                      alt={fabric.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{fabric.name}</h3>
                      <p className="text-sm text-gray-600">{fabric.category_name}</p>
                      {fabric.seller_company && (
                        <p className="text-sm text-gray-500">by {fabric.seller_company}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          orderType === "sample" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {orderType === "sample" ? "Sample Order" : "Bulk Order"}
                        </span>
                        <span className="text-gray-600">{quantity} meters</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck size={20} />
                    Shipping Details
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Amit Sharma"
                        data-testid="checkout-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={customer.company}
                        onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Company Name (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="you@company.com"
                        data-testid="checkout-email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="+91 98765 43210"
                        data-testid="checkout-phone"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <input
                        type="text"
                        required
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Street address, building, floor"
                        data-testid="checkout-address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={customer.city}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={customer.state}
                        onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        value={customer.pincode}
                        onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="400001"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Any special instructions or requirements..."
                  />
                </div>

                {/* Payment Error */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-red-800">Payment Failed</p>
                      <p className="text-sm text-red-600">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button (Mobile) */}
                <div className="lg:hidden">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="checkout-pay-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Pay ₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Price Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-24">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Payment Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per meter</span>
                    <span>₹{pricePerMeter.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span>{quantity} meters</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (5%)</span>
                    <span>₹{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-emerald-600">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Desktop Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="hidden lg:flex w-full items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  data-testid="checkout-pay-btn-desktop"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay Now
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Secured by Razorpay
                </div>

                {/* Info */}
                <p className="mt-4 text-xs text-gray-500 text-center">
                  By placing this order, you agree to our terms of service and privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
