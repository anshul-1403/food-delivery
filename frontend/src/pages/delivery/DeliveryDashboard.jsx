import React, { useEffect, useState } from "react";
import { 
  getAvailableOrders, 
  pickupOrder, 
  getPartnerOrders, 
  completeDelivery,
  getProfile,
  requestVehicleUpdate,
  sendMessage,
  customerReply,
  confirmClose,
  declineClose,
  getMyMessages 
} from "../../services/api";
import { toast } from "react-toastify";
import ChatPanel from "../../components/chat/ChatPanel";
import { Chip, Box, Typography, Paper, TextField, Button, Avatar, CircularProgress, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PersonIcon from "@mui/icons-material/Person";
import "./DeliveryDashboard.css";

import { connectSocket, socket } from "../../services/socket";

const DeliveryDashboard = () => {
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [newVehicleId, setNewVehicleId] = useState("");
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const availableRes = await getAvailableOrders();
      const myRes = await getPartnerOrders();
      const profileRes = await getProfile();
      setAvailableJobs(availableRes.data);
      const partner = profileRes.data;
      setPartnerInfo(partner);
      
      const activeTasks = myRes.data.filter(o => o.status === "Out for Delivery" || o.status === "Awaiting Delivery Confirmation");
      setMyTasks(activeTasks);

      // Fetch messages for appeal/status
      if (partner.role === "delivery") {
        const msgRes = await getMyMessages();
        setMessages(msgRes.data);
      }
    } catch (error) {
      console.error("Fetch Delivery Data Error:", error);
      if (!silent) toast.error("Failed to fetch delivery data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    connectSocket();

    const refreshData = () => fetchData(true);

    socket.on("status_update", refreshData);
    socket.on("order_status_update", refreshData);
    socket.on("new_order", refreshData);
    socket.on("new_thread_message", refreshData);
    socket.on("message_close_request", refreshData);
    socket.on("message_closed", refreshData);
    socket.on("message_close_declined", refreshData);

    return () => {
      socket.off("status_update", refreshData);
      socket.off("order_status_update", refreshData);
      socket.off("new_order", refreshData);
      socket.off("new_thread_message", refreshData);
      socket.off("message_close_request", refreshData);
      socket.off("message_closed", refreshData);
      socket.off("message_close_declined", refreshData);
    };
  }, []);

  const handlePickup = async (orderId) => {
    try {
      await pickupOrder(orderId);
      toast.success("Job picked up! Drive safe. 🚴");
      setActiveChatOrderId(orderId); 
      setActiveTab("tasks");
      fetchData();
    } catch (error) {
      toast.error("Failed to pick up job");
    }
  };

  const handleRequestVehicleChange = async (e) => {
    e.preventDefault();
    try {
      if (!newVehicleId) return;
      await requestVehicleUpdate(newVehicleId);
      toast.success("Request sent to admin!");
      setNewVehicleId("");
      fetchData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleComplete = async (orderId) => {
    if (!orderId) {
      toast.error("Invalid order ID for completion.");
      return;
    }
    try {
      await completeDelivery(orderId);
      toast.success("Delivery completed! Great job. 🎉");
      if (activeChatOrderId === orderId) setActiveChatOrderId(null);
      fetchData();
    } catch (error) {
      console.error("Complete Delivery Front-end Error:", error);
      const msg = error.response?.data?.message || "Failed to complete delivery";
      toast.error(msg);
    }
  };

  const handleAppealMessage = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const activeThread = messages.find(m => !m.isClosed);
      if (activeThread) {
        await customerReply(activeThread._id, replyText);
      } else {
        await sendMessage({ subject: "Partner Status Inquiry / Appeal", content: replyText });
      }
      setReplyText("");
      fetchData(true);
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setSendingReply(false);
    }
  };

  const handleConfirmClose = async (msgId) => {
    try {
      await confirmClose(msgId);
      toast.success("Conversation closed.");
      fetchData(true);
    } catch (e) { toast.error("Failed to close"); }
  };

  const handleDeclineClose = async (msgId) => {
    try {
      await declineClose(msgId);
      toast.info("Close request declined.");
      fetchData(true);
    } catch (e) { toast.error("Failed to decline"); }
  };

  // Render Logic for Pending/Rejected Partners
  if (partnerInfo && partnerInfo.status !== "approved") {
    const isRejected = partnerInfo.status === "rejected";
    const activeThread = messages.find(m => !m.isClosed) || messages[0];

    return (
      <div className="delivery-dashboard">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" color="white" sx={{ fontWeight: 800, mb: 2 }}>Partner Application Status</Typography>
          <Paper elevation={10} sx={{ p: 4, borderRadius: 4, bgcolor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
             <Box sx={{ mb: 3 }}>
                <Chip 
                  label={partnerInfo.status.toUpperCase()} 
                  color={isRejected ? "error" : "warning"} 
                  sx={{ fontWeight: 'bold', fontSize: '1rem', px: 2, height: 35, mb: 2 }}
                />
                <Typography variant="h5" sx={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
                  {isRejected ? "Application Not Approved" : "Application Under Review"}
                </Typography>
                <Typography sx={{ color: 'var(--text-color)', opacity: 0.7, mt: 1 }}>
                  {isRejected 
                    ? "Your application was not approved for our fleet. If you believe this is a mistake, please talk to our team below." 
                    : "We are currently verifying your vehicle and documents. You'll receive full access once approved."}
                </Typography>
             </Box>

             <Divider sx={{ my: 3, bgcolor: 'var(--border-color)' }} />

             <Box sx={{ textAlign: 'left' }}>
               <Typography variant="h6" sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                 <SupportAgentIcon color="error" /> {isRejected ? "Chat to Appeal / Support" : "Ask for Update"}
               </Typography>
               
               {activeThread?.closeRequestedBy === "admin" && !activeThread?.isClosed && (
                 <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255, 165, 0, 0.15)', borderRadius: 2, border: '1px solid orange' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ flex: 1, color: 'var(--text-color)' }}>
                        🔔 Support has requested to close this conversation.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleConfirmClose(activeThread._id)}>Yes, Close</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleDeclineClose(activeThread._id)}>No</Button>
                      </Box>
                    </Box>
                 </Paper>
               )}

               {activeThread?.closeRequestedBy === "customer" && !activeThread?.isClosed && (
                 <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(0,0,255,0.1)', borderRadius: 2, textAlign: 'center' }}>
                   <Typography variant="caption" sx={{ color: 'var(--text-color)', opacity: 0.8 }}>⏳ Waiting for support to confirm your close request...</Typography>
                 </Paper>
               )}

               <Box sx={{ 
                 maxHeight: 300, 
                 overflowY: 'auto', 
                 mb: 2, 
                 p: 2, 
                 bgcolor: 'var(--secondary-bg)', 
                 borderRadius: 2,
                 display: 'flex',
                 flexDirection: 'column',
                 gap: 1.5
               }}>
                 {activeThread?.thread.map((m, i) => (
                    <Box key={i} sx={{ alignSelf: m.senderRole === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: m.senderRole === 'customer' ? '#e74c3c' : 'rgba(0,0,0,0.06)',
                        color: m.senderRole === 'customer' ? 'white' : 'var(--text-color)'
                      }}>
                        <Typography variant="body2">{m.content}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.7, color: 'var(--text-color)', display: 'block', mt: 0.5, textAlign: m.senderRole === 'customer' ? 'right' : 'left' }}>
                        {m.senderRole === 'customer' ? "You" : "Support"} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                 ))}
                 {!activeThread && <Typography sx={{ opacity: 0.8, color: 'var(--text-color)', textAlign: 'center', py: 4 }}>No messages yet. Send a message to start a conversation.</Typography>}
               </Box>

               {!activeThread?.isClosed ? (
                <form onSubmit={(e) => { e.preventDefault(); handleAppealMessage(); }} style={{ display: 'flex', gap: '8px' }}>
                  <TextField
                    fullWidth
                    placeholder={activeThread ? "Type a reply..." : "Start a conversation to appeal..."}
                    size="small"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: 1,
                      "& .MuiOutlinedInput-input": { color: 'var(--text-color)' },
                      "& .MuiInputBase-input::placeholder": { color: 'var(--text-color)', opacity: 0.6 }
                    }}
                  />
                  <Button 
                    type="submit"
                    variant="contained" 
                    sx={{ 
                      bgcolor: '#e74c3c', 
                      minWidth: 50,
                      "&:hover": { bgcolor: '#c0392b' },
                      "&.Mui-disabled": { bgcolor: 'rgba(231, 76, 60, 0.4)', color: 'rgba(255,255,255,0.4)' }
                    }} 
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" sx={{ color: 'white' }} />}
                  </Button>
                </form>
               ) : (
                <Box sx={{ p: 2, bgcolor: 'var(--secondary-bg)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Conversation closed. Start a new one if you have more questions.</Typography>
                </Box>
               )}
             </Box>
          </Paper>
        </Box>
      </div>
    );
  }

  return (
    <div className="delivery-dashboard">
      <div className="delivery-header">
        <h1>Delivery Partner Dashboard</h1>
        <div className="delivery-tabs">
          <button className={activeTab === "available" ? "active" : ""} onClick={() => setActiveTab("available")}>
            Available Jobs ({availableJobs.length})
          </button>
          <button className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>
            My Active Tasks ({myTasks.length})
          </button>
          <button className={activeTab === "fleet" ? "active" : ""} onClick={() => setActiveTab("fleet")}>
            My Vehicle
          </button>
        </div>
      </div>

      <div className="delivery-content">
        {loading ? (
          <div className="delivery-loader">Loading jobs...</div>
        ) : activeTab === "available" ? (
          <div className="jobs-list">
            {availableJobs.length === 0 ? (
              <p className="no-data">No jobs available right now. Check back later!</p>
            ) : (
              availableJobs.map(order => (
                <div key={order._id} className="delivery-card">
                  <div className="card-top">
                    <span className="order-tag">#{order._id.slice(-6)}</span>
                    <span className="price-tag">Rs. {order.totalAmount}</span>
                  </div>
                  <div className="card-body">
                    <p><strong>Customer:</strong> {order.user?.name}</p>
                    <p><strong>Address:</strong> {order.address}</p>
                    <p><strong>Payment:</strong> {order.paymentMethod}</p>
                  </div>
                  <button className="btn-pickup" onClick={() => handlePickup(order._id)}>
                    Pick Up Order
                  </button>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "fleet" ? (
          <div className="fleet-settings">
            <div className="delivery-card">
              <h3>Vehicle Information</h3>
              <div className="card-body">
                <p><strong>Current Vehicle:</strong> {partnerInfo?.vehicleId}</p>
                <p><strong>Type:</strong> {partnerInfo?.vehicleType}</p>
                {partnerInfo?.pendingVehicleId && (
                  <div style={{ background: 'rgba(243, 156, 18, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #f39c12', marginTop: '10px' }}>
                    <p style={{ color: '#f39c12', margin: 0, fontWeight: 'bold' }}>Pending Change: {partnerInfo.pendingVehicleId}</p>
                    <p variant="caption" style={{ fontSize: '0.7rem', opacity: 0.8 }}>Waiting for admin approval</p>
                  </div>
                )}
              </div>
              {!partnerInfo?.pendingVehicleId && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4>Request Vehicle Change</h4>
                  <form onSubmit={handleRequestVehicleChange} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="New ID (MH12AB1234)"
                      required
                      value={newVehicleId}
                      onChange={(e) => setNewVehicleId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--secondary-bg)',
                        color: 'var(--text-color)',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button type="submit" className="btn-pickup" style={{ width: 'auto', padding: '0 20px' }}>
                      Send Request
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="jobs-list">
            {myTasks.length === 0 ? (
              <p className="no-data">You have no active deliveries. Grab a job!</p>
            ) : (
              myTasks.map(order => (
                <div key={order._id} className="delivery-card active-card">
                  <div className="card-top">
                    <span className="order-tag">#{order._id.slice(-6)}</span>
                    <span className="status-tag">OUT FOR DELIVERY</span>
                  </div>
                  <div className="card-body">
                    <p><strong>Customer:</strong> {order.user?.name}</p>
                    <p><strong>Phone:</strong> {order.phone}</p>
                    <p><strong>Address:</strong> {order.address}</p>
                    <p><strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus === "Paid" ? "ALREADY PAID" : "COLLECT CASH"})</p>
                  </div>
                  <div className="delivery-card-actions">
                    <button className="btn-chat" onClick={() => setActiveChatOrderId(activeChatOrderId === order._id ? null : order._id)}>
                      💬 {activeChatOrderId === order._id ? "Hide Chat" : "Open Chat"}
                    </button>
                    {order.status === "Out for Delivery" ? (
                      <button className="btn-complete" onClick={() => handleComplete(order._id)}>
                        Mark as Delivered
                      </button>
                    ) : (
                      <Chip label="Waiting for Customer" sx={{ flex: 1, height: 44, bgcolor: "var(--secondary-bg)", color: "var(--text-color)", borderRadius: "8px", fontWeight: "bold" }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeChatOrderId && (
        <ChatPanel
          orderId={activeChatOrderId}
          myRole="delivery"
          isActive={myTasks.some(t => t._id === activeChatOrderId)}
          onClose={() => setActiveChatOrderId(null)}
          onStatusChange={() => fetchData(true)}
        />
      )}
    </div>
  );
};

export default DeliveryDashboard;
