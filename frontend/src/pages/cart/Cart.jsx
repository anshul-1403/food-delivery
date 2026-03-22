import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "./Cart.css";
import { createOrder, getProfile } from "../../services/api";
import { toast } from "react-toastify";


const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  //this is called on component mount
  useEffect(() => {
    let localCart = localStorage.getItem("cart");
    if (localCart) localCart = JSON.parse(localCart);
    if (localCart) setCart(localCart);

    // Pre-fill from saved profile
    const loadProfile = async () => {
      try {
        if (localStorage.getItem("token")) {
          const { data } = await getProfile();
          if (data.address) setAddress(data.address);
          if (data.phone) setPhone(data.phone);
        }
      } catch (e) { /* not logged in yet */ }
    };
    loadProfile();
  }, []);


  const handleRemove = () => {
    localStorage.removeItem("cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const loadScript = (source) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = source;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOrder = async () => {
    if (!localStorage.getItem("token")) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    if (!address || !phone) {
      toast.error("Please provide address and phone number");
      return;
    }

    if (paymentMethod === "Razorpay") {
      await handleRazorpay();
    } else {
      await placeOrder("COD", "Pending", "");
    }
  };

  const handleRazorpay = async () => {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "rzp_test_VSdp7X3K39GwBK", // Using the test key from user's code
      amount: totalAmount * 100,
      currency: "INR",
      name: "Food Delivery App",
      description: "Delicious food at your doorstep",
      handler: async (response) => {
        await placeOrder("Razorpay", "Paid", response.razorpay_payment_id);
      },
      prefill: {
        name: JSON.parse(localStorage.getItem("user"))?.name || "User",
        email: JSON.parse(localStorage.getItem("user"))?.email || "user@example.com",
        contact: phone,
      },
      theme: { color: "#e74c3c" },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const placeOrder = async (method, status, pId) => {
    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          dish: item._id, 
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: totalAmount,
        address,
        phone,
        paymentMethod: method,
        paymentStatus: status,
        paymentId: pId
      };

      const response = await createOrder(orderData);
      toast.success(method === "Razorpay" ? "Payment Successful! Order Placed." : "Order placed successfully (COD)!");
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));
      navigate(`/confirmed/${response.data._id}`);
    } catch (error) {
      console.error("Order Error:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };


  if (cart.length <= 0) {
    return (
      <div className="empty-msg">
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-3613108-3020773.png"
          width="250px"
          alt=""
        />
        <h1>Cart is Empty !</h1>
        <NavLink to="/foods" className="return-shop">
          return to shop
        </NavLink>
      </div>
    );
  }

  const totalPrice = () => {
    let totalAmout = 0;
    cart.forEach((item) => {
      totalAmout += item.price * item.quantity;
    });
    return totalAmout;
  };
  const totalAmount = totalPrice();

  return (
    <div className="cart-food-list">
      <div className="cart-child">
        <h2 style={{ textAlign: "center" }}>Your Food List...</h2>
        {cart.map((item) => {
          const { name, price, img, _id, quantity } = item;
          return (
            <div key={_id || item.id} className="cart-item">
              <img src={img} alt="" />
              <p className="cart-item-name">{name}</p>
              <p className="cart-price">
                Rs. {price} x {quantity}
              </p>
            </div>
          );
        })}
      </div>
      <div className="subtotal">
        <h2>Checkout Details</h2>
        <div className="checkout-form" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Delivery Address"
            className="form-control mb-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ 
              padding: "10px", width: "100%", borderRadius: "5px", 
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)"
            }}
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ 
              padding: "10px", width: "100%", borderRadius: "5px", 
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)"
            }}
          />
        </div>
        
        <div className="payment-method" style={{ marginBottom: "20px" }}>
          <h3>Select Payment Method</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", border: paymentMethod === "COD" ? "2px solid #e74c3c" : "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", flex: 1, color: "var(--text-color)" }}>
              <input 
                type="radio" 
                name="payment" 
                value="COD" 
                checked={paymentMethod === "COD"} 
                onChange={() => setPaymentMethod("COD")}
                style={{ marginRight: "10px" }}
              />
              Cash on Delivery
            </label>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", border: paymentMethod === "Razorpay" ? "2px solid #e74c3c" : "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", flex: 1, color: "var(--text-color)" }}>
              <input 
                type="radio" 
                name="payment" 
                value="Razorpay" 
                checked={paymentMethod === "Razorpay"} 
                onChange={() => setPaymentMethod("Razorpay")}
                style={{ marginRight: "10px" }}
              />
              Online (Razorpay)
            </label>
          </div>
        </div>

        <div className="subtotao-details">
          <p>Total Price : Rs. {totalAmount}</p>
          <hr />
          <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Final Price : Rs. {totalAmount}</p>
        </div>
        <button
          className="check-btn"
          onClick={handleOrder}
          disabled={loading}
          style={{ backgroundColor: "#e74c3c", color: "white", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Placing Order..." : "Order Now"}
        </button>
        <button onClick={() => navigate("/foods")} className="return-btn">
          Return to shop
        </button>
        <p onClick={() => handleRemove()} className="delete-icon" style={{ cursor: "pointer", color: "#e74c3c", marginTop: "10px" }}>
          Empty Cart: <DeleteForeverIcon />
        </p>
      </div>
    </div>
  );
};


export default Cart;
