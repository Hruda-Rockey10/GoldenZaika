"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart.store";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/auth.store";
import { Download, CheckCircle2, MapPin, Plus, AlertCircle } from "lucide-react";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { addressService } from "@/services/address.service";
import { zoneService } from "@/services/zone.service";
import { auth } from "@/lib/firebase/client";
import Link from "next/link";
import Script from "next/script";

export default function OrderPage() {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Data State
  const [addresses, setAddresses] = useState([]);
  const [zones, setZones] = useState([]);
  
  // Selection State
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isZoneValid, setIsZoneValid] = useState(true); // Default true until checked? No, false or null.
  const [zoneError, setZoneError] = useState(null);
  const [instructions, setInstructions] = useState("");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
        router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Fetch Data
  useEffect(() => {
    if (user) {
        Promise.all([
            addressService.getMyAddresses(),
            zoneService.getPublicZones() // Use public endpoint
        ]).then(([addrRes, zoneRes]) => {
            if (addrRes.success) {
                setAddresses(addrRes.addresses);
                // Auto-select default
                const def = addrRes.addresses.find(a => a.isDefault);
                if (def) setSelectedAddressId(def.id);
                else if (addrRes.addresses.length > 0) setSelectedAddressId(addrRes.addresses[0].id);
            }
            if (zoneRes.success) setZones(zoneRes.zones);
        }).catch(err => console.error("Checkout data fetch error", err));
    }
  }, [user]);

  // Handle Address Selection & Zone Validation
  useEffect(() => {
      if (selectedAddressId && addresses.length > 0 && zones.length > 0) {
          const addr = addresses.find(a => a.id === selectedAddressId);
          setSelectedAddress(addr);
          
          if (addr) {
             // Validate Pincode
             const matchedZone = zones.find(z => z.pincodes.includes(addr.zip) && z.isActive);
             if (matchedZone) {
                 setIsZoneValid(true);
                 setDeliveryFee(matchedZone.deliveryFee);
                 setZoneError(null);
                 
                 // Check Min Order Amount
                 const currentSubtotal = getTotalPrice();
                 if (matchedZone.minOrderAmount && currentSubtotal < matchedZone.minOrderAmount) {
                     setZoneError(`Minimum order for this area is ₹${matchedZone.minOrderAmount}`);
                     setIsZoneValid(false);
                 }
                 
             } else {
                 setIsZoneValid(false);
                 setDeliveryFee(0);
                 setZoneError("Delivery not available to this pincode.");
             }
          }
      }
  }, [selectedAddressId, addresses, zones, getTotalPrice]);

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      setIsApplyingCoupon(true);
      const currentSubtotal = mounted ? getTotalPrice() : 0;
      try {
          const res = await fetch("/api/coupons/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: couponCode, cartTotal: currentSubtotal }), 
          });
          const data = await res.json();
          if (data.success) {
              setDiscount(data.discount);
              setCouponApplied(true);
              toast.success(`Coupon ${couponCode} applied! Saved ₹${data.discount}`);
          } else {
              toast.error(data.error || "Invalid coupon");
              setDiscount(0);
              setCouponApplied(false);
          }
      } catch (error) {
          toast.error("Failed to apply coupon");
      } finally {
          setIsApplyingCoupon(false);
      }
  };

  // Calculate values only on client side after mount to prevent hydration errors
  const subtotal = mounted ? getTotalPrice() : 0;
  const tax = subtotal * 0.05; // 5% GST standard
  // Total logic
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddress || !isZoneValid) {
        toast.error("Please select a valid delivery address");
        return;
    }

    setLoading(true);

    try {
      // Get Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      
      // 1. Create Order via Payment Service
      const paymentRes = await paymentService.createOrder(total, token);

      if (!paymentRes.success) {
        toast.error("Failed to initiate payment");
        setLoading(false);
        return;
      }

      const order = paymentRes.order;

      // 2. Initialize Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Golden Zaika",
        description: "Food Order",
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const token = await auth.currentUser?.getIdToken();
            const verifyRes = await paymentService.verifyPayment(response, token);
            if (verifyRes.success) {
              // 4. Save Order to Database
              try {
                // Construct full address string for backward compatibility or store object
                const fullAddressString = `${selectedAddress.label}: ${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.zip}. \nPhone: ${selectedAddress.phone}`;
                
                const orderPayload = {
                  shippingAddress: fullAddressString,
                  shippingAddressDetails: selectedAddress, // Store full object for future use
                  instructions: instructions || "",
                  items: items.map(item => ({...item, id: item.id || item._id})),
                  totalAmount: total,
                  subtotal,
                  tax,
                  deliveryFee,
                  discount,
                  couponCode: couponApplied ? couponCode : null,
                  status: "Placed", // Explicitly set initial status
                };

                const saveOrderRes = await orderService.createOrder(orderPayload);

                if (saveOrderRes.success) {
                  toast.success("Order Placed Successfully!");
                  clearCart();
                  router.push("/orders");
                } else {
                  toast.error("Payment verified but failed to save order.");
                }
              } catch (saveError) {
                console.error("Save Order Error:", saveError);
                toast.error("Payment verified but failed to save order.");
              }
            } else {
              toast.error("Payment Verification Failed");
            }
          } catch (error) {
            toast.error("Verification Error");
          }
        },
        prefill: {
          name: user?.displayName || "Guest",
          email: user?.email,
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#ffd700",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      rzp1.on("payment.failed", function (response) {
        toast.error("Payment Failed: " + response.error.description);
        setLoading(false);
      });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Side: Address Selection */}
        <div className="flex-1 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 text-primary-gold flex items-center justify-between">
            <span>Delivery Address</span>
            <Link href="/profile/addresses" className="text-sm text-white bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors flex items-center gap-1">
                <Plus size={16}/> Manage
            </Link>
          </h2>

          <div className="space-y-4">
             {addresses.length === 0 ? (
                 <div className="text-center py-10 border border-dashed border-white/20 rounded-xl">
                     <p className="text-gray-400 mb-4">No saved addresses found.</p>
                     <Link href="/profile/addresses" className="text-primary-gold font-bold hover:underline">Add a new address</Link>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {addresses.map(addr => (
                         <div 
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                                selectedAddressId === addr.id 
                                    ? "border-primary-gold bg-primary-gold/5" 
                                    : "border-white/10 hover:border-white/30"
                            }`}
                         >
                             <div className="flex items-start gap-3">
                                <div className={`mt-1 ${selectedAddressId === addr.id ? "text-primary-gold" : "text-gray-500"}`}>
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{addr.label}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">{addr.street}, {addr.city} {addr.zip}</p>
                                    <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>
                                </div>
                             </div>
                             {selectedAddressId === addr.id && (
                                 <div className="absolute top-4 right-4 text-primary-gold">
                                    <CheckCircle2 size={20} fill="currentColor" className="text-black"/>
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             )}
          </div>

          {/* Validation Error */}
          {selectedAddressId && zoneError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                      <p className="font-bold">Delivery Unavailable</p>
                      <p className="text-sm">{zoneError}</p>
                  </div>
              </div>
          )}

          {/* Instructions */}
          <div className="mt-6">
              <label className="block text-sm font-bold text-gray-400 mb-2">Delivery Instructions (Optional)</label>
              <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave at door, call upon arrival..."
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-gold min-h-[100px]"
              />
          </div>

          {/* Checkout Button (Moved inside form logic equivalent) */}
          <button
              onClick={handleSubmit}
              disabled={loading || !selectedAddressId || !isZoneValid}
              className="w-full py-4 bg-primary-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-lg mt-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : `Pay ₹${Math.max(0, total - discount).toFixed(2)}`}
            </button>
            {!selectedAddressId && <p className="text-center text-gray-500 text-sm mt-2">Select an address to proceed</p>}
        </div>

        {/* Right Side: Your Cart Summary */}
        <div className="w-full lg:w-[450px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary-gold">Your Cart</h2>
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <Download size={14} />
              Invoice
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Background gradient hint */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-red/5 blur-3xl rounded-full -z-10"></div>

            {/* Items List */}
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {items.map((item) => {
                const id = item.id || item._id;
                return (
                <div
                  key={id}
                  className="flex justify-between items-start border-b border-white/5 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-gray-300">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              )})}
            </div>

            {/* Coupon Section */}
            <div className="mb-6">
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Promo Code" 
                   value={couponCode}
                   onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                   disabled={couponApplied}
                   className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:border-primary-gold outline-none disabled:opacity-50"
                 />
                 {couponApplied ? (
                   <button 
                     type="button"
                     onClick={() => {
                        setCouponApplied(false);
                        setDiscount(0);
                        setCouponCode("");
                        toast.info("Coupon removed");
                     }}
                     className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors"
                   >
                     Remove
                   </button>
                 ) : (
                   <button 
                     type="button"
                     onClick={handleApplyCoupon}
                     disabled={!couponCode || isApplyingCoupon}
                     className="bg-primary-gold/20 text-primary-gold px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-gold/30 transition-colors disabled:opacity-50"
                   >
                     {isApplyingCoupon ? "..." : "Apply"}
                   </button>
                 )}
               </div>
               {couponApplied && <p className="text-green-500 text-xs mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Coupon applied successfully!</p>}
            </div>

            {/* Totals */}
            <div className="bg-black/40 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Delivery Fee</span>
                <span>{deliveryFee > 0 ? `₹${deliveryFee}` : (isZoneValid && selectedAddressId ? "Free" : "--")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400 text-sm">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between text-primary-gold font-bold text-lg">
                <span>Total</span>
                <span>₹{Math.max(0, total - discount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    </div>
  );
}

