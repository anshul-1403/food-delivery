import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container, Paper, Typography, TextField, Button, Box,
  Avatar, Divider, Chip, CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  sendMessage, customerReply, getMyMessages,
  requestClose, confirmClose, declineClose,
} from "../../services/api";
import { toast } from "react-toastify";
import "./Contact.css";

import { connectSocket, socket } from "../../services/socket";

const Contact = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/messages");
    if (location.state?.subject) setSubject(location.state.subject);
    if (location.state?.content) setNewMsg(location.state.content);
  }, [location.state]);

  const [subject, setSubject] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const threadRef = useRef(null);

  const scrollToBottom = () => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const { data } = await getMyMessages();
      setMessages(data);
      if (selected) {
        const updated = data.find(m => m._id === selected._id);
        if (updated) setSelected(updated);
      }
    } catch (e) { /* not logged in */ } finally {
      setFetching(false);
    }
  };

  // Initial fetch and Socket setup
  useEffect(() => {
    fetchMessages();
    connectSocket();
  }, []);

  // Listen for socket events when a thread is selected
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
      // Also update the list in background
      fetchMessages(); 
    };

    const handleCloseRequest = ({ messageId, role }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, closeRequestedBy: role }));
      }
      fetchMessages();
    };

    const handleClosed = ({ messageId }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, isClosed: true, closeRequestedBy: null }));
      }
      fetchMessages();
    };

    const handleDeclined = ({ messageId }) => {
      if (messageId === selected._id) {
        setSelected(prev => ({ ...prev, closeRequestedBy: null }));
      }
      fetchMessages();
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

  const handleNewMessage = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login"); navigate("/login"); return; }
    setLoading(true);
    try {
      await sendMessage({ subject: subject || "General Enquiry", content: newMsg });
      toast.success("Message sent! Support will reply shortly.");
      setSubject(""); setNewMsg("");
      await fetchMessages();
    } catch (e) { toast.error("Failed to send"); } finally { setLoading(false); }
  };

  const handleCustomerReply = async () => {
    if (!replyText.trim() || !selected) return;
    setLoading(true);
    try {
      // We rely on socket for selected update, but call API to save
      await customerReply(selected._id, replyText);
      setReplyText("");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to send"); }
    finally { setLoading(false); }
  };

  const handleRequestClose = async () => {
    try {
      await requestClose(selected._id, "customer");
      toast.info("Close request sent. Waiting for support to confirm.");
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

  const formatDate = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });


  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: "var(--text-color)" }}>Contact & Support</Typography>
      <Typography variant="body1" sx={{ mb: 4, color: "var(--text-color)", opacity: 0.6 }}>
        Send us a message and our team will reply in this thread.
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Compose Panel */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, flex: "0 0 340px", height: "fit-content", bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>New Conversation</Typography>
          <form onSubmit={handleNewMessage}>
            <TextField fullWidth label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} margin="normal" placeholder="e.g. Issue with my order" sx={{ "& .MuiInputBase-input": { color: "var(--text-color)" }, "& .MuiInputLabel-root": { color: "var(--text-color)" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" } }} />
            <TextField fullWidth label="Message" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} margin="normal" multiline rows={4} required placeholder="Describe your question..." sx={{ "& .MuiInputBase-input": { color: "var(--text-color)" }, "& .MuiInputLabel-root": { color: "var(--text-color)" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" } }} />
            <Button type="submit" variant="contained" fullWidth disabled={loading} endIcon={<SendIcon />}
              sx={{ mt: 2, bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" }, "&:disabled": { bgcolor: "#e74c3c", opacity: 0.5, color: "rgba(255,255,255,0.8)" }, borderRadius: 2, py: 1.3 }}>
              {loading ? "Sending..." : "Start Conversation"}
            </Button>
          </form>
          {!user && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Please <strong style={{ cursor: "pointer", color: "#e74c3c" }} onClick={() => navigate("/login")}>login</strong> to send messages.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Thread Panel */}
        <Box sx={{ flex: 1 }}>
          {!selected ? (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "var(--text-color)" }}>
                My Conversations {messages.length > 0 && `(${messages.length})`}
              </Typography>
              {fetching ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress color="error" /></Box>
              ) : messages.length === 0 ? (
                <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: "center", color: "#aaa", bgcolor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                  <SupportAgentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography>No conversations yet.</Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {messages.map((msg) => (
                    <Paper key={msg._id} elevation={2}
                      sx={{ p: 2, borderRadius: 2, cursor: "pointer", border: "2px solid var(--border-color)", "&:hover": { border: "2px solid #e74c3c" }, transition: "all 0.2s", bgcolor: "var(--card-bg)", color: "var(--text-color)" }}
                      onClick={() => setSelected(msg)}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{msg.subject}</Typography>
                          <Typography variant="caption" sx={{ color: "var(--text-color)", opacity: 0.6 }}>{formatDate(msg.createdAt)}</Typography>
                        </Box>
                        <Chip
                          label={msg.isClosed ? "Closed" : msg.thread?.filter(t => t.senderRole === "admin").length > 0 ? "Replied" : "Pending"}
                          color={msg.isClosed ? "default" : msg.thread?.filter(t => t.senderRole === "admin").length > 0 ? "success" : "warning"}
                          size="small"
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", height: "70vh" }}>
              {/* Thread Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, color: "var(--text-color)" }}>
                <Button variant="outlined" size="small" onClick={() => setSelected(null)} sx={{ borderRadius: 2, borderColor: "var(--border-color)", color: "var(--text-color)" }}>← Back</Button>
                <Typography variant="h6" sx={{ fontWeight: "bold", flex: 1 }}>{selected.subject}</Typography>
                <Chip label={selected.isClosed ? "Closed" : `${selected.thread?.length || 0} messages`} color={selected.isClosed ? "default" : "primary"} size="small" />
                {!selected.isClosed && selected.closeRequestedBy !== "customer" && (
                  <Button size="small" color="error" startIcon={<CloseIcon />} onClick={handleRequestClose} sx={{ ml: 1 }}>
                    Close Chat
                  </Button>
                )}
              </Box>

              {/* Admin requested close banner */}
              {selected.closeRequestedBy === "admin" && !selected.isClosed && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff3e0", borderRadius: 2, display: "flex", alignItems: "center", gap: 2, color: "rgba(0,0,0,0.8)" }}>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: "bold" }}>
                    🔔 Support has requested to close this conversation. Do you agree?
                  </Typography>
                  <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleConfirmClose}>Yes, Close</Button>
                  <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleDeclineClose}>No, Continue</Button>
                </Paper>
              )}

              {selected.closeRequestedBy === "customer" && !selected.isClosed && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: "#e8f4fd", borderRadius: 2, color: "rgba(0,0,0,0.8)" }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>⏳ Waiting for support to confirm the close request...</Typography>
                </Paper>
              )}

              {/* Chat Thread */}
              <Paper ref={threadRef} elevation={2} sx={{ flex: 1, overflow: "auto", p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2, bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>
                {selected.thread?.map((entry, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, flexDirection: entry.senderRole === "customer" ? "row" : "row-reverse" }}>
                    <Avatar sx={{ bgcolor: entry.senderRole === "customer" ? "#3498db" : "#e74c3c", width: 32, height: 32, flexShrink: 0 }}>
                      {entry.senderRole === "customer" ? <PersonIcon fontSize="small" /> : <SupportAgentIcon fontSize="small" />}
                    </Avatar>
                    <Box sx={{
                      maxWidth: "65%", p: 1.5, borderRadius: 2,
                      bgcolor: entry.senderRole === "customer" ? "#e8f4fd" : "#fdecea",
                      textAlign: entry.senderRole === "customer" ? "left" : "right",
                      color: "rgba(0,0,0,0.85)"
                    }}>
                      <Typography variant="caption" sx={{ display: "block", mb: 0.5, opacity: 0.7 }}>
                        {entry.senderRole === "customer" ? "You" : "Support"} · {formatDate(entry.createdAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{entry.content}</Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>


              {/* Reply Input */}
              {!selected.isClosed ? (
                <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
                  <TextField
                    fullWidth size="small" variant="outlined"
                    placeholder="Type your reply... (Enter to send)"
                    value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCustomerReply(); } }}
                    multiline maxRows={3}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, color: "var(--text-color)", borderColor: "var(--border-color)" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" } }}
                  />
                  <Button variant="contained" onClick={handleCustomerReply} disabled={loading || !replyText.trim()} endIcon={<SendIcon />}
                    sx={{ bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" }, "&:disabled": { bgcolor: "#e74c3c", opacity: 0.5, color: "rgba(255,255,255,0.8)" }, borderRadius: 2, px: 3, flexShrink: 0 }}>
                    {loading ? "..." : "Send"}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">This conversation has been closed.</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Contact;
