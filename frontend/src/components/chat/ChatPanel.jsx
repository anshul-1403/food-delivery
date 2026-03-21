import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, TextField, Button, Avatar, Paper, IconButton, Chip, Stack } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { 
  getOrderChat, 
  sendOrderChatMessage, 
  requestCloseOrderChat, 
  confirmCloseOrderChat, 
  declineCloseOrderChat,
  requestOrderCancellation
} from "../../services/api";
import { connectSocket, socket } from "../../services/socket";
import { toast } from "react-toastify";
import "./ChatPanel.css";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const ChatPanel = ({ orderId, myRole, isActive: externalIsActive, onClose, onStatusChange }) => {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatActive, setChatActive] = useState(true);
  const [closeRequestedBy, setCloseRequestedBy] = useState(null);
  const [minimised, setMinimised] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const threadRef = useRef(null);

  const scrollToBottom = () => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  };

  const fetchChatAndOrder = () => {
    if (!orderId) return;
    getOrderChat(orderId)
      .then(({ data }) => {
        setMessages(data.messages || []);
        setChatActive(data.isActive);
        setCloseRequestedBy(data.closeRequestedBy);
        setOrderData(data.orderId); // The populate might give us full order if we updated backend, but check
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchChatAndOrder();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    connectSocket();
    socket.emit("join_chat", orderId);

    const handleNewMessage = ({ orderId: eOrderId, message }) => {
      if (eOrderId.toString() === orderId.toString()) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleChatClosed = ({ orderId: eOrderId }) => {
      if (eOrderId.toString() === orderId.toString()) {
        setChatActive(false);
        setCloseRequestedBy(null);
        onStatusChange?.(); 
      }
    };

    const handleCloseRequest = ({ orderId: eOrderId, role }) => {
      if (eOrderId.toString() === orderId.toString()) {
        setCloseRequestedBy(role);
      }
    };

    const handleCloseDeclined = ({ orderId: eOrderId }) => {
      if (eOrderId.toString() === orderId.toString()) {
        setCloseRequestedBy(null);
      }
    };

    const handleStatusUpdate = () => fetchChatAndOrder();

    socket.on("new_chat_message", handleNewMessage);
    socket.on("chat_closed", handleChatClosed);
    socket.on("chat_close_request", handleCloseRequest);
    socket.on("chat_close_declined", handleCloseDeclined);
    socket.on("order_status_update", handleStatusUpdate);

    return () => {
      socket.off("new_chat_message", handleNewMessage);
      socket.off("chat_closed", handleChatClosed);
      socket.off("chat_close_request", handleCloseRequest);
      socket.off("chat_close_declined", handleCloseDeclined);
      socket.off("order_status_update", handleStatusUpdate);
    };
  }, [orderId]);

  useEffect(() => {
    if (externalIsActive === false) {
      setChatActive(false);
    }
  }, [externalIsActive]);

  const handleSend = async () => {
    if (!text.trim() || !chatActive) return;
    setLoading(true);
    try {
      const msgText = text;
      setText("");
      await sendOrderChatMessage(orderId, msgText, myRole);
    } catch (e) {
      toast.error("Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClose = async () => {
    try {
      await requestCloseOrderChat(orderId, myRole);
      toast.info("Closure request sent. Waiting for confirmation...");
    } catch (e) { toast.error("Request failed"); }
  };

  const handleReportUnreachable = async () => {
    try {
      await requestOrderCancellation(orderId, "Customer is not replying in chat / not answering.");
      toast.warning("Cancellation request sent to admin.");
    } catch (e) { toast.error("Failed to send request"); }
  };

  const handleConfirmClose = async () => {
    try {
      await confirmCloseOrderChat(orderId);
      toast.success("Chat closed and delivery confirmed! 🎉");
      onStatusChange?.(); 
    } catch (e) { toast.error("Confirmation failed"); }
  };

  const handleDeclineClose = async () => {
    try {
      await declineCloseOrderChat(orderId);
      toast.info("Closure request declined.");
    } catch (e) { toast.error("Decline failed"); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  if (!orderId) return null;

  const isCancelRequested = orderData?.cancellationRequest?.requestedBy === "delivery";

  return (
    <div className={`chat-panel ${minimised ? "minimised" : ""}`}>
      <div className="chat-panel-header" onClick={() => setMinimised(!minimised)}>
        <ChatIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2" sx={{ fontWeight: "bold", flex: 1, ml: 1 }}>
          {myRole === "customer" ? "BiteDash Delivery Chat" : "Chat with Customer"}
        </Typography>
        
        {isCancelRequested && <Chip icon={<WarningAmberIcon sx={{ fontSize: '12px !important' }} />} label="Cancel Req" size="small" color="error" sx={{ mr: 1, height: 18, fontSize: "0.6rem" }} />}
        {!chatActive && <Chip label="Delivered" size="small" sx={{ mr: 1, height: 18, fontSize: "0.6rem", bgcolor: "#2ecc71", color: "#fff" }} />}
        
        {chatActive && !closeRequestedBy && myRole === "delivery" && !isCancelRequested && (
           <Button 
            size="small" 
            sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.55rem", minWidth: 0, mr: 1, textTransform: 'none' }} 
            onClick={(e) => { e.stopPropagation(); handleReportUnreachable(); }}
           >
             Can't Reach?
           </Button>
        )}

        {chatActive && !closeRequestedBy && (
           <Button size="small" sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.6rem", minWidth: 0, mr: 1 }} onClick={(e) => { e.stopPropagation(); handleRequestClose(); }}>
             Close
           </Button>
        )}

        <IconButton size="small" sx={{ color: "#fff", p: 0 }} onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>


      {!minimised && (
        <>
          {chatActive && closeRequestedBy && (
            <Paper sx={{ p: 1.5, m: 1, bgcolor: "var(--secondary-bg)", borderRadius: 2, border: "1px solid var(--accent-color)" }}>
              <Typography variant="caption" sx={{ display: "block", mb: 1, fontWeight: "bold" }}>
                {closeRequestedBy === myRole 
                  ? "Waiting for other party to confirm closure..." 
                  : `${closeRequestedBy === "delivery" ? "Partner" : "Customer"} wants to close chat & confirm delivery.`}
              </Typography>
              {closeRequestedBy !== myRole && (
                <Stack direction="row" spacing={1}>
                  <Button fullWidth size="small" variant="contained" color="success" startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />} onClick={handleConfirmClose} sx={{ fontSize: "0.7rem" }}>Confirm</Button>
                  <Button fullWidth size="small" variant="outlined" color="error" startIcon={<CancelIcon sx={{ fontSize: 14 }} />} onClick={handleDeclineClose} sx={{ fontSize: "0.7rem" }}>Decline</Button>
                </Stack>
              )}
            </Paper>
          )}

          <div className="chat-panel-thread" ref={threadRef}>
            {messages.map((msg, i) => {
              const isMe = msg.senderRole === myRole;
              return (
                <div key={i} className={`chat-msg-row ${isMe ? "me" : "other"}`}>
                  {!isMe && (
                    <Avatar sx={{ width: 26, height: 26, bgcolor: msg.senderRole === "delivery" ? "#27ae60" : "#3498db", flexShrink: 0 }}>
                      {msg.senderRole === "delivery" ? <LocalShippingIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                    </Avatar>
                  )}
                  <div className={`chat-bubble-msg ${isMe ? "me" : "other"}`}>
                    <p>{msg.content}</p>
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {chatActive ? (
            <div className="chat-panel-input">
              <TextField
                fullWidth size="small" variant="outlined"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "20px", bgcolor: "var(--card-bg)", fontSize: "0.85rem", color: "var(--text-color)" },
                  "& fieldset": { border: "1px solid var(--border-color)" },
                }}
              />
              <IconButton onClick={handleSend} disabled={loading || !text.trim()}
                sx={{ ml: 1, bgcolor: "var(--accent-color)", color: "#fff", "&:hover": { bgcolor: "#c0392b" }, "&:disabled": { bgcolor: "var(--accent-color)", opacity: 0.5, color: "rgba(255,255,255,0.8)" }, width: 38, height: 38 }}>
                <SendIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </div>
          ) : (
            <div className="chat-panel-closed" style={{ background: "var(--secondary-bg)", padding: 10, textAlign: "center" }}>
              <Typography variant="caption" color="textSecondary">Order Delivered & Chat Closed 🎉</Typography>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatPanel;

