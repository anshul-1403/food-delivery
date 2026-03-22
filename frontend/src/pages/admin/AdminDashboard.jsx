import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
} from "@mui/material";

import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAllOrders,
  updateOrderStatus,
  getDishes,
  addDish,
  deleteDish,
  getAllMessages,
  replyToMessage,
  getPartners,
  updatePartnerStatus,
  handleVehicleUpdate,
} from "../../services/api";
import { Tabs, Tab, TextField, Grid, Card, CardContent, CardMedia, IconButton, Tooltip, Badge, Avatar } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SendIcon from "@mui/icons-material/Send";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";


const statusOrder = ["Placed", "Confirmed", "Cooking", "Ready to Deliver", "Out for Delivery", "Delivered"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState({ orderId: null, newStatus: "" });
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);


  // New Dish Form State
  const [newDish, setNewDish] = useState({ name: "", img: "", category: "Food", price: "", quantity: 10 });

  const fetchOrders = async () => {
    try {
      const response = await getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await getDishes();
      setDishes(response.data);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await getAllMessages();
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  const fetchPartners = async () => {
    try {
      const { data } = await getPartners();
      setPartners(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user || user.role !== "admin") {
      toast.error("Access denied. Admins only.");
      navigate("/");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchInventory(),
        fetchMessages(),
        fetchPartners()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [navigate]);


  const handleStatusChange = (orderId, newStatus) => {
    setPendingUpdate({ orderId, newStatus });
    setOpenConfirm(true);
  };

  const handleReply = async (msgId) => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      await replyToMessage(msgId, replyContent);
      toast.success("Reply sent!");
      setReplyContent("");
      await fetchMessages();
    } catch (e) {
      toast.error("Failed to send reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (isSubmittingStatus) return;
    setIsSubmittingStatus(true);
    const { orderId, newStatus } = pendingUpdate;
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
      setOpenConfirm(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    try {
      await addDish(newDish);
      toast.success("New dish added to inventory!");
      setNewDish({ name: "", img: "", category: "Food", price: "", quantity: 10 });
      fetchInventory();
    } catch (error) {
      toast.error("Failed to add dish");
    }
  };

  const handleDeleteDish = async (id) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteDish(id);
        toast.success("Dish removed from inventory");
        fetchInventory();
      } catch (error) {
        toast.error("Failed to delete dish");
      }
    }
  };
  const handlePartnerStatus = async (userId, status) => {
    try {
      await updatePartnerStatus(userId, status);
      toast.success(`Partner ${status}!`);
      fetchPartners();
    } catch (e) { toast.error("Update failed"); }
  };

  const handleVehicleAction = async (userId, action, manualId = "") => {
    try {
      await handleVehicleUpdate(userId, action, manualId);
      toast.success(`Vehicle ${action} successful!`);
      fetchPartners();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case "Placed": return "default";
      case "Confirmed": return "primary";
      case "Cooking": return "warning";
      case "Ready to Deliver": return "secondary";
      case "Out for Delivery": return "info";
      case "Delivered": return "success";
      case "Cancelled": return "error";
      default: return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
        Admin Environment
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
          <div className="loading-spinner" style={{ animation: "spin 2s linear infinite", display: "flex", justifyContent: "center" }}>
            <span style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #e74c3c", borderRadius: "50%", width: "40px", height: "40px", display: "inline-block" }}></span>
          </div>
          <Typography variant="body1" sx={{ color: "var(--text-color)" }}>Loading Admin Data...</Typography>
          <style>{"@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }"}</style>
        </Box>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              mb: 4,
              borderBottom: 1,
              borderColor: 'var(--border-color)',
              "& .MuiTab-root": {
                color: "var(--text-color)",
                opacity: 0.7,
                fontWeight: "bold"
              },
              "& .Mui-selected": {
                color: "#e74c3c !important",
                opacity: 1
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#e74c3c"
              }
            }}
          >

            <Tab label="Manage Orders" />
            <Tab label="Manage Inventory" />
            <Tab label="Delivery Partners" />
            <Tab
              label={
                <Badge badgeContent={messages.filter(m => !m.isRead && !m.isClosed).length} color="error">
                  Messages
                </Badge>
              }
              onClick={() => navigate("/admin/messages")}
            />

          </Tabs>


          {activeTab === 0 && (
            <TableContainer component={Paper} elevation={3} sx={{ bgcolor: "var(--card-bg)", borderRadius: 3, border: "1px solid var(--border-color)" }}>
              <Table>
                <TableHead sx={{ backgroundColor: "var(--secondary-bg)" }}>
                  <TableRow>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Order ID</TableCell>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Customer</TableCell>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Items</TableCell>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Total</TableCell>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "var(--text-color)", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} sx={{ transition: "0.2s", "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                      <TableCell sx={{ color: "var(--text-color)" }}>{order._id.substring(0, 8)}...</TableCell>
                      <TableCell sx={{ color: "var(--text-color)" }}>
                        {order.user?.name} <br />
                        <Typography variant="caption" sx={{ color: "var(--text-color)", opacity: 0.6 }}>{order.phone}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: "var(--text-color)" }}>
                        {order.items.map((item) => (
                          <div key={item._id}>
                            {item.name} x {item.quantity}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell sx={{ color: "var(--text-color)" }}>Rs. {order.totalAmount}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status) !== "default" ? getStatusColor(order.status) : undefined}
                            size="small"
                            sx={{
                              fontWeight: "bold",
                              ...(getStatusColor(order.status) === "default" && {
                                bgcolor: "rgba(127, 140, 141, 0.3)",
                                color: "var(--text-color)",
                                border: "1px solid rgba(127, 140, 141, 0.5)"
                              })
                            }}
                          />
                          {order.cancellationRequest?.requestedBy && !order.cancellationRequest.isProcessed && order.status !== "Delivered" && order.status !== "Cancelled" && (
                            <Tooltip title={`Issue Reported: ${order.cancellationRequest.reason || "No reason provided"}`}>
                              <Chip
                                icon={<WarningAmberIcon sx={{ fontSize: '14px !important' }} />}
                                label="ISSUE"
                                color="error"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            size="small"
                            disabled={order.status === "Delivered" || order.status === "Cancelled"}
                            sx={{
                              color: "var(--text-color)",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" },
                              "& .MuiSvgIcon-root": { color: "var(--text-color)" },
                              "&.Mui-disabled": { opacity: 0.7 },
                              "& .MuiSelect-select.Mui-disabled": { WebkitTextFillColor: "var(--text-color)" },
                              minWidth: 120
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  bgcolor: "var(--card-bg)",
                                  color: "var(--text-color)",
                                  border: "1px solid var(--border-color)",
                                  "& .MuiMenuItem-root": {
                                    fontSize: "0.85rem",
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                                    "&.Mui-selected": { bgcolor: "rgba(231, 76, 60, 0.2)", color: "#e74c3c" },
                                    "&.Mui-selected:hover": { bgcolor: "rgba(231, 76, 60, 0.3)" }
                                  }
                                }
                              }
                            }}
                          >
                            {statusOrder.map((status) => {
                              const currentIndex = statusOrder.indexOf(order.status);
                              const optionIndex = statusOrder.indexOf(status);
                              const isDeliveryPartnerStatus = status === "Out for Delivery" || status === "Delivered";

                              if (isDeliveryPartnerStatus && status !== order.status) {
                                return null;
                              }

                              return (
                                <MenuItem
                                  key={status}
                                  value={status}
                                  disabled={optionIndex < currentIndex || isDeliveryPartnerStatus}
                                >
                                  {status}
                                </MenuItem>
                              );
                            })}
                            <MenuItem
                              value="Cancelled"
                              disabled={order.status === "Delivered" || order.status === "Cancelled"}
                            >
                              Cancelled
                            </MenuItem>
                          </Select>

                          {order.cancellationRequest?.requestedBy && !order.cancellationRequest.isProcessed && order.status !== "Delivered" && order.status !== "Cancelled" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ fontSize: '0.6rem', py: 0 }}
                              onClick={() => {
                                toast.info("Opening message thread...");
                                navigate("/admin/messages", {
                                  state: {
                                    autoSubject: `Issue with Order #${order._id.slice(-6)}`,
                                    targetUser: order.user?._id,
                                    targetUserName: order.user?.name
                                  }
                                });
                              }}
                            >
                              Mediate
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "var(--text-color)" }}>
                    Add New Dish
                  </Typography>
                  <form onSubmit={handleAddDish}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={newDish.name}
                      onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                      margin="normal"
                      required
                      sx={{ "& .MuiInputBase-input": { color: "var(--text-color)" }, "& .MuiInputLabel-root": { color: "var(--text-color)" } }}
                    />
                    <TextField
                      fullWidth
                      label="Image URL"
                      value={newDish.img}
                      onChange={(e) => setNewDish({ ...newDish, img: e.target.value })}
                      margin="normal"
                      required
                      sx={{ "& .MuiInputBase-input": { color: "var(--text-color)" }, "& .MuiInputLabel-root": { color: "var(--text-color)" } }}
                    />
                    <Select
                      fullWidth
                      value={newDish.category}
                      onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                      sx={{ mt: 2, color: "var(--text-color)", "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" } }}
                    >
                      <MenuItem value="Food">Food</MenuItem>
                      <MenuItem value="Drink">Drink</MenuItem>
                    </Select>
                    <TextField
                      fullWidth
                      label="Price (Rs)"
                      type="number"
                      value={newDish.price}
                      onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                      margin="normal"
                      required
                      sx={{ "& .MuiInputBase-input": { color: "var(--text-color)" }, "& .MuiInputLabel-root": { color: "var(--text-color)" } }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={<AddCircleIcon />}
                      sx={{ mt: 3, bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" }, py: 1.2, fontWeight: "bold" }}
                    >
                      Add to Inventory
                    </Button>
                  </form>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  {dishes.map((dish) => (
                    <Grid item xs={12} sm={6} key={dish._id}>
                      <Card sx={{ display: 'flex', borderRadius: 2, height: '120px', bgcolor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                        <CardMedia
                          component="img"
                          sx={{ width: 120 }}
                          image={dish.img}
                          alt={dish.name}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <CardContent sx={{ flex: '1 0 auto', py: 1, px: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "var(--text-color)" }}>
                              {dish.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "var(--text-color)", opacity: 0.6 }}>
                              Rs. {dish.price} | {dish.category}
                            </Typography>
                          </CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteDish(dish._id)} color="error" size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}


          {activeTab === 2 && (
            <TableContainer component={Paper} elevation={3} sx={{ bgcolor: "var(--card-bg)", borderRadius: 3, border: "1px solid var(--border-color)" }}>
              <Table>
                <TableHead sx={{ backgroundColor: "var(--secondary-bg)" }}>
                  <TableRow>
                    <TableCell align="left" sx={{ color: "var(--text-color)", fontWeight: "bold", width: '20%' }}>Name</TableCell>
                    <TableCell align="left" sx={{ color: "var(--text-color)", fontWeight: "bold", width: '25%' }}>Vehicle</TableCell>
                    <TableCell align="left" sx={{ color: "var(--text-color)", fontWeight: "bold", width: '25%' }}>Contact</TableCell>
                    <TableCell align="left" sx={{ color: "var(--text-color)", fontWeight: "bold", width: '15%' }}>Status</TableCell>
                    <TableCell align="left" sx={{ color: "var(--text-color)", fontWeight: "bold", width: '15%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell align="left" sx={{ color: "var(--text-color)" }}>{p.name}</TableCell>
                      <TableCell align="left" sx={{ color: "var(--text-color)" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{p.vehicleId || "Not Set"}</Typography>
                          <IconButton size="small" onClick={() => {
                            const newId = prompt("Enter New Vehicle ID (Manual Override):", p.vehicleId || "");
                            if (newId === null) return;
                            handleVehicleAction(p._id, "override", newId || p.vehicleId);
                          }}>
                            <SendIcon sx={{ fontSize: 16, opacity: 0.9, color: "#e74c3c" }} />
                          </IconButton>
                        </div>

                        {(p.pendingVehicleId) && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(243, 156, 18, 0.1)', borderRadius: 1, border: '1px dashed #f39c12' }}>
                            {p.pendingVehicleId && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#f39c12', fontWeight: 'bold' }}>
                                New Requested: {p.pendingVehicleId}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Button size="small" sx={{ fontSize: '0.6rem', py: 0 }} variant="contained" color="warning" onClick={() => handleVehicleAction(p._id, 'approve')}>Approve</Button>
                              <Button size="small" sx={{ fontSize: '0.6rem', py: 0 }} variant="outlined" color="error" onClick={() => handleVehicleAction(p._id, 'reject')}>Reject</Button>
                            </Stack>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="left" sx={{ color: "var(--text-color)" }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          {p.phone && <div style={{ opacity: 0.7 }}>📞 {p.phone}</div>}
                          <div style={{ fontWeight: 500 }}>✉️ {p.email}</div>
                        </div>
                      </TableCell>
                      <TableCell align="left">
                        <Chip
                          label={p.status.toUpperCase()}
                          color={p.status === 'approved' ? 'success' : p.status === 'pending' ? 'warning' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="left">
                        {p.status === 'pending' ? (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" color="success" onClick={() => handlePartnerStatus(p._id, 'approved')}>Approve</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => handlePartnerStatus(p._id, 'rejected')}>Reject</Button>
                          </Stack>
                        ) : (
                          <Button
                            size="small"
                            color={p.status === 'approved' ? 'error' : 'success'}
                            variant="text"
                            onClick={() => handlePartnerStatus(p._id, p.status === 'approved' ? 'rejected' : 'approved')}
                          >
                            {p.status === 'approved' ? 'Disable' : 'Enable'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}


          <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>

            <DialogTitle sx={{ fontWeight: "bold", bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>Confirm Status Change</DialogTitle>
            <DialogContent sx={{ bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>
              <Typography sx={{ color: "var(--text-color)" }}>
                Are you sure you want to change the status to <strong>{pendingUpdate.newStatus}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: "var(--card-bg)" }}>
              <Button onClick={() => setOpenConfirm(false)} sx={{ color: "var(--text-color)", opacity: 0.7 }}>
                Cancel
              </Button>
              <Button
                onClick={confirmStatusChange}
                variant="contained"
                disabled={isSubmittingStatus}
                sx={{ bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" } }}
              >
                {isSubmittingStatus ? "Updating..." : "Confirm"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>

  );
};


export default AdminDashboard;
