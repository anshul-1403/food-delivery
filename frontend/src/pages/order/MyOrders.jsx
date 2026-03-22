import React, { useEffect, useState } from "react";
import { getUserOrders } from "../../services/api";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ChatPanel from "../../components/chat/ChatPanel";
import "./MyOrders.css";
import { connectSocket, socket } from "../../services/socket";


const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await getUserOrders();
      const data = response.data;
      setOrders(data);
      const activeDelivery = data.find(o => o.status === "Out for Delivery" || o.status === "Awaiting Delivery Confirmation");
      if (activeDelivery && !activeChatOrderId) setActiveChatOrderId(activeDelivery._id);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      toast.error("Failed to fetch your orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    connectSocket();

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) => 
        prev.map(o => o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)
      );
      if (updatedOrder.status === "Delivered" && activeChatOrderId === updatedOrder._id) {
        // Chat closed automatically
      }
    };

    socket.on("order_status_update", handleStatusUpdate);
    socket.on("status_update", handleStatusUpdate);

    return () => {
      socket.off("order_status_update", handleStatusUpdate);
      socket.off("status_update", handleStatusUpdate);
    };
  }, []);


  const handleReorder = (order) => {
    // Replace cart with items from this order
    const cartItems = order.items.map(item => ({
      _id: item._id,
      id: item.id, // handle both
      name: item.name,
      price: item.price,
      img: item.img,
      quantity: item.quantity
    }));
    
    localStorage.setItem("cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success("Past items added to cart!");
    navigate("/cart");
  };

  if (loading) return (
    <div style={{ marginTop: '100px', textAlign: 'center', color: 'var(--text-color)' }}>
      <div className="loading" style={{ margin: '0 auto 20px auto' }}></div>
      <p>Loading your orders...</p>
    </div>
  );

  return (
    <div className="my-orders-container">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="no-orders" style={{ textAlign: 'center', marginTop: '50px' }}>
          <p>You haven't placed any orders yet.</p>
          <NavLink to="/foods" className="btn-shop">Order Now</NavLink>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">ID: #{order._id.slice(-6)}</span>
                <span className={`order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-content">
                <div className="order-details">
                  <p><strong>Total:</strong> Rs. {order.totalAmount}</p>
                  <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  {order.deliveryPartner && (
                    <div className="partner-verification-card" style={{ marginTop: '10px', background: 'rgba(231, 76, 60, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Driver:</strong> {order.deliveryPartner.name}</p>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Vehicle No:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{order.deliveryPartner.vehicleId}</span></p>
                      
                      {(order.status === "Out for Delivery" || order.status === "Awaiting Delivery Confirmation") && (
                        <div 
                          style={{ marginTop: '8px', cursor: 'pointer', color: '#e74c3c', fontSize: '0.75rem', textDecoration: 'underline', display: 'block' }}
                          onClick={() => navigate("/contact", { state: { 
                            subject: "🚨 Vehicle Mismatch Report", 
                            content: `Important: The vehicle for order #${order._id.slice(-6)} does not match. \nAssigned Driver: ${order.deliveryPartner.name}\nAuthorized Vehicle: ${order.deliveryPartner.vehicleId}\n\nPlease investigate.` 
                          }})}
                        >
                          Vehicle Mismatch? Report to Support
                        </div>
                      )}
                    </div>
                  )}
                </div>

                
                <div className="order-items-summary">
                  <strong>Items:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '15px', color: '#666', fontSize: '0.9rem' }}>
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="order-actions">
                {order.status !== "Cancelled" && (
                  <NavLink to={`/track/${order._id}`} className="btn-track">
                    Track Order
                  </NavLink>
                )}
                
                {order.status === "Delivered" && (
                  <button 
                    className="btn-reorder"
                    onClick={() => handleReorder(order)}
                  >
                    Quick Reorder
                  </button>
                )}


                {(order.status === "Out for Delivery" || order.status === "Awaiting Delivery Confirmation") && (
                   <button 
                    className="btn-chat"
                    onClick={() => setActiveChatOrderId(activeChatOrderId === order._id ? null : order._id)}
                   >
                     {activeChatOrderId === order._id ? "Hide Chat" : "Open Chat & Track"}
                   </button>
                )}

                {order.status === "Awaiting Delivery Confirmation" && (
                  <button 
                    className="btn-reorder"
                    style={{ marginLeft: '10px' }}
                    onClick={() => setActiveChatOrderId(order._id)}
                  >
                    Confirm Receipt
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {activeChatOrderId && (
        <ChatPanel
          orderId={activeChatOrderId}
          myRole="customer"
          isActive={orders.some(o => o._id === activeChatOrderId && o.status !== "Delivered")}
          onClose={() => setActiveChatOrderId(null)}
          onStatusChange={fetchOrders}
        />
      )}

    </div>
  );
};

export default MyOrders;


