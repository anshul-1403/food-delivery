import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Typography, TextField, Button, Box,
  Avatar, Chip, CircularProgress, Badge, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PersonIcon from "@mui/icons-material/Person";
import InboxIcon from "@mui/icons-material/Inbox";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import {
  getAllMessages, replyToMessage,
  requestClose, confirmClose, declineClose, markAsRead,
  sendMessage, getAllUsers
} from "../../services/api";
import { toast } from "react-toastify";
import "./AdminMessages.css";

import { connectSocket, socket } from "../../services/socket";

const AdminMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [newMsg, setNewMsg] = useState({ subject: "", content: "", targetUser: null });
  const [allUsers, setAllUsers] = useState([]);
  const threadRef = useRef(null);

  const scrollToBottom = () => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  };

  const selectThread = async (msg) => {
    setSelected(msg);
    setReplyText("");
    if (!msg.isRead) {
      try {
        await markAsRead(msg._id);
        // Socket event 'thread_updated' will update the messages list badge count
      } catch (e) { console.error(e); }
    }
  };


  const fetchMessages = async () => {
    try {
      const { data } = await getAllMessages();
      setMessages(data);
      if (selected) {
        const updated = data.find(m => m._id === selected._id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") {
      toast.error("Access denied.");
      navigate("/");
      return;
    }
    fetchMessages();
    const fetchAllUsers = async () => {
      try {
        const { data } = await getAllUsers();
        setAllUsers(data);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };
    fetchAllUsers();
    connectSocket();

    // If coming from Dashboard mediation
    if (location.state?.targetUser) {
      setNewMsg(prev => ({ 
        ...prev, 
        targetUser: { _id: location.state.targetUser, name: location.state.targetUserName },
        subject: location.state.autoSubject || "Order Issue"
      }));
      setOpenNew(true);
    }

    // Listen for global admin events
    socket.on("new_message_thread", (msg) => {
      setMessages(prev => [msg, ...prev]);
      toast.info(`New message thread: ${msg.subject}`);
    });

    socket.on("thread_updated", (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    return () => {
      socket.off("new_message_thread");
      socket.off("thread_updated");
    };
  }, [navigate]);

  const handleCreateNew = async () => {
    if (!newMsg.targetUser || !newMsg.subject || !newMsg.content) return;
    setLoading(true);
    try {
      await sendMessage({ 
        subject: newMsg.subject, 
        content: newMsg.content, 
        targetUserId: newMsg.targetUser._id 
      });
      
      toast.success("Message sent to customer!");
      setOpenNew(false);
      setNewMsg({ subject: "", content: "", targetUser: null });
      fetchMessages();
    } catch (e) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // Listen for specific selected thread events
  useEffect(() => {
    if (!selected) return;

    socket.emit("join_message", selected._id);

    const handleNewThreadMessage = ({ messageId, entry }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({
          ...prev,
          thread: [...prev.thread, entry]
        }));
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleCloseRequest = ({ messageId, role }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, closeRequestedBy: role }));
      }
    };

    const handleClosed = ({ messageId }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, isClosed: true, closeRequestedBy: null }));
      }
    };

    const handleDeclined = ({ messageId }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, closeRequestedBy: null }));
      }
    };

    socket.on("new_thread_message", handleNewThreadMessage);
    socket.on("message_close_request", handleCloseRequest);
    socket.on("message_closed", handleClosed);
    socket.on("message_close_declined", handleDeclined);

    return () => {
      socket.off("new_thread_message", handleNewThreadMessage);
      socket.off("message_close_request", handleCloseRequest);
      socket.off("message_closed", handleClosed);
      socket.off("message_close_declined", handleDeclined);
    };
  }, [selected?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [selected?.thread?.length]);

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setLoading(true);
    try {
      await replyToMessage(selected._id, replyText);
      setReplyText("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClose = async () => {
    try {
      await requestClose(selected._id, "admin");
      toast.info("Close request sent. Waiting for customer to confirm.");
    } catch (e) { toast.error("Failed"); }
  };

  const handleConfirmClose = async () => {
    try {
      await confirmClose(selected._id);
      toast.success("Conversation closed.");
    } catch (e) { toast.error("Failed"); }
  };

  const handleDeclineClose = async () => {
    try {
      await declineClose(selected._id);
      toast.info("Close request declined. Chat continues.");
    } catch (e) { toast.error("Failed"); }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });


  const unreadCount = messages.filter(m => !m.isRead && !m.isClosed).length;

  return (
    <div className="admin-messages-page">
      {/* ── Sidebar ── */}
      <div className="admin-messages-sidebar">
        <Box sx={{ p: 2.5, borderBottom: "1px solid var(--border-color)", bgcolor: "var(--card-bg)" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, color: "var(--text-color)" }}>
            <SupportAgentIcon sx={{ color: "var(--accent-color)" }} /> Messages
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} color="error" size="small" sx={{ ml: 1, fontWeight: "bold" }} />
            )}
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNew(true)} sx={{ ml: 'auto', bgcolor: '#e74c3c', fontSize: '0.65rem' }}>
              New
            </Button>
          </Typography>
        </Box>


        {fetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress color="error" size={32} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 6, color: "var(--text-color)", opacity: 0.3, px: 2 }}>
            <InboxIcon sx={{ fontSize: 48 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>No messages yet</Typography>
          </Box>
        ) : (
          <div className="admin-messages-list">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`admin-message-item ${selected?._id === msg._id ? "active" : ""} ${!msg.isRead && !msg.isClosed ? "unread" : ""}`}
                onClick={() => selectThread(msg)}
              >

                <Avatar sx={{ bgcolor: "var(--accent-color)", width: 38, height: 38, flexShrink: 0 }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <div className="admin-message-item-body">
                  <div className="admin-message-item-header">
                    <span className="admin-message-sender">{msg.sender?.name || "Customer"}</span>
                    <span className="admin-message-time">{new Date(msg.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p className="admin-message-subject">{msg.subject}</p>
                  <p className="admin-message-preview">
                    {msg.thread?.[msg.thread.length - 1]?.content?.substring(0, 55) || ""}...
                  </p>
                  {msg.isClosed && <Chip label="Closed" size="small" sx={{ mt: 0.5, height: 18, fontSize: "0.65rem", bgcolor: "var(--secondary-bg)", color: "var(--text-color)" }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Chat ── */}
      <div className="admin-messages-main">
        {!selected ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-color)", opacity: 0.3 }}>
            <SupportAgentIcon sx={{ fontSize: 72, mb: 2 }} />
            <Typography variant="h6">Select a conversation</Typography>
            <Typography variant="body2">Choose a message from the left to reply</Typography>
          </Box>
        ) : (
          <>
            {/* Header */}
            <div className="admin-chat-header">
              <Avatar sx={{ bgcolor: "var(--accent-color)", width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", lineHeight: 1.2, color: "var(--text-color)" }}>
                  {selected.sender?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--text-color)", opacity: 0.6 }}>{selected.sender?.email}</Typography>
              </Box>
              <Chip label={selected.subject} variant="outlined" size="small" sx={{ color: "var(--text-color)", borderColor: "var(--border-color)" }} />

              <Chip
                label={selected.isClosed ? "Closed" : `${selected.thread?.length || 0} messages`}
                color={selected.isClosed ? "default" : "primary"}
                size="small" sx={{ ml: 1 }}
              />
              {!selected.isClosed && selected.closeRequestedBy !== "admin" && (
                <Button size="small" color="error" startIcon={<CloseIcon />} onClick={handleRequestClose} sx={{ ml: 1 }}>
                  Close
                </Button>
              )}
            </div>

            {/* Customer requested close banner */}
            {selected.closeRequestedBy === "customer" && !selected.isClosed && (
              <Paper sx={{ m: 2, p: 2, bgcolor: "rgba(255, 152, 0, 0.1)", border: "1px solid #ff9800", borderRadius: 2, display: "flex", alignItems: "center", gap: 2, color: "var(--text-color)" }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  🔔 The customer has requested to close this conversation. Confirm?
                </Typography>
                <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleConfirmClose}>Yes, Close</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleDeclineClose}>No, Continue</Button>
              </Paper>
            )}

            {selected.closeRequestedBy === "admin" && !selected.isClosed && (
              <Paper sx={{ m: 2, p: 2, bgcolor: "rgba(33, 150, 243, 0.1)", border: "1px solid #2196f3", borderRadius: 2, color: "var(--text-color)" }}>
                <Typography variant="body2">⏳ Waiting for the customer to confirm closure...</Typography>
              </Paper>
            )}

            {/* Thread */}
            <div className="admin-chat-thread" ref={threadRef}>
              {selected.thread?.map((entry, i) => (
                <div key={i} className={`chat-bubble-row ${entry.senderRole === "admin" ? "admin" : "customer"}`}>
                  <Avatar sx={{
                    bgcolor: entry.senderRole === "customer" ? "#3498db" : "#e74c3c",
                    width: 32, height: 32, flexShrink: 0,
                  }}>
                    {entry.senderRole === "customer" ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}
                  </Avatar>
                  <div className={`chat-bubble ${entry.senderRole === "admin" ? "admin-bubble" : "customer-bubble"}`}>
                    <span className="chat-bubble-meta">
                      {entry.senderRole === "customer" ? selected.sender?.name : "You (Support)"} · {formatDate(entry.createdAt)}
                    </span>
                    <p>{entry.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {!selected.isClosed ? (
              <div className="admin-chat-input">
                <TextField
                  fullWidth variant="outlined"
                  placeholder="Type your reply... (Enter to send)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  multiline maxRows={4} size="small"
                  sx={{ 
                    "& .MuiOutlinedInput-root": { 
                      borderRadius: 3,
                      color: "var(--text-color)",
                      "& fieldset": { borderColor: "var(--border-color)" }
                    },
                    "& .MuiInputBase-input": { color: "var(--text-color)" },
                    "& .MuiInputLabel-root": { color: "var(--text-color)", opacity: 0.7 }
                  }}
                />
                <Button variant="contained" onClick={handleReply} disabled={loading || !replyText.trim()} endIcon={<SendIcon />}
                  sx={{ ml: 1.5, bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" }, "&:disabled": { bgcolor: "#e74c3c", opacity: 0.5, color: "rgba(255,255,255,0.8)" }, borderRadius: 2, px: 3, flexShrink: 0 }}>
                  {loading ? "..." : "Send"}
                </Button>
              </div>
            ) : (
              <Box sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
                <Typography variant="body2" color="textSecondary">This conversation has been closed.</Typography>
              </Box>
            )}
          </>
        )}
      </div>
      
      {/* ── New Conversation Dialog ── */}
      <Dialog 
        open={openNew} 
        onClose={() => setOpenNew(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: "var(--card-bg)", color: "var(--text-color)" } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>New Message to Customer</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "var(--card-bg)", color: "var(--text-color)", "& .MuiTypography-root": { color: "var(--text-color)" } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {!location.state?.targetUser ? (
              <Autocomplete
                options={allUsers}
                getOptionLabel={(option) => `${option.name} (${option.email}) - ${option.role}`}
                value={newMsg.targetUser}
                onChange={(e, val) => setNewMsg({ ...newMsg, targetUser: val })}
                renderInput={(params) => <TextField {...params} label="Select Target User" placeholder="Search by name or email" />}
                isOptionEqualToValue={(option, value) => option._id === value?._id}
              />
            ) : (
              <Typography variant="body2" color="textSecondary">
                Send a direct message to: <strong>{newMsg.targetUser?.name || "Target User"}</strong>
              </Typography>
            )}
            <TextField 
              fullWidth label="Subject" 
              value={newMsg.subject} 
              onChange={(e) => setNewMsg({...newMsg, subject: e.target.value})} 
              placeholder="e.g. Issue with your recent order"
            />
            <TextField 
              fullWidth multiline rows={4} 
              label="Message Content" 
              value={newMsg.content} 
              onChange={(e) => setNewMsg({...newMsg, content: e.target.value})} 
              placeholder="Type your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "var(--card-bg)" }}>
          <Button onClick={() => setOpenNew(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateNew} 
            disabled={loading || !newMsg.subject || !newMsg.content}
            sx={{ bgcolor: '#e74c3c', "&:hover": { bgcolor: '#c0392b' }, "&:disabled": { bgcolor: "#e74c3c", opacity: 0.5, color: "rgba(255,255,255,0.8)" } }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};


export default AdminMessages;
