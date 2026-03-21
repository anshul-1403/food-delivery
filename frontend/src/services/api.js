import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) => api.post("/user/login", { email, password });
export const register = (data) => api.post("/user/register", data);
export const getProfile = () => api.get("/user/profile");
export const updateProfile = (data) => api.patch("/user/profile", data);
export const registerDelivery = (data) => api.post("/user/register-delivery", data);
export const getPartners = () => api.get("/user/partners");
export const getAllUsers = () => api.get("/user/all");
export const updatePartnerStatus = (userId, status) => api.patch("/user/partner-status", { userId, status });
export const requestVehicleUpdate = (newId) => api.patch("/user/vehicle-request", { newId });
export const handleVehicleUpdate = (userId, action, manualId) => api.patch("/user/vehicle-handle", { userId, action, manualId });


export const sendMessage = (data) => api.post("/messages", data);
export const customerReply = (messageId, content) => api.post(`/messages/${messageId}/reply/customer`, { content });
export const getMyMessages = () => api.get("/messages/mine");
export const getAllMessages = () => api.get("/messages/all");
export const replyToMessage = (messageId, content) => api.post(`/messages/${messageId}/reply`, { content });
export const requestClose = (messageId, role) => api.post(`/messages/${messageId}/close-request`, { role });
export const confirmClose = (messageId) => api.post(`/messages/${messageId}/confirm-close`);
export const declineClose = (messageId) => api.post(`/messages/${messageId}/decline-close`);
export const markAsRead = (messageId) => api.post(`/messages/${messageId}/mark-read`);


export const getOrderChat = (orderId) => api.get(`/order-chat/${orderId}`);
export const sendOrderChatMessage = (orderId, content, senderRole) =>
  api.post(`/order-chat/${orderId}/message`, { content, senderRole });
export const requestCloseOrderChat = (orderId, role) => api.post(`/order-chat/${orderId}/request-close`, { role });
export const confirmCloseOrderChat = (orderId) => api.post(`/order-chat/${orderId}/confirm-close`);
export const declineCloseOrderChat = (orderId) => api.post(`/order-chat/${orderId}/decline-close`);


export const getDishes = () => api.get("/dishes");
export const addDish = (dishData) => api.post("/dishes/add", dishData);
export const deleteDish = (id) => api.delete(`/dishes/${id}`);
export const updateDish = (id, dishData) => api.patch(`/dishes/${id}`, dishData);


export const createOrder = (orderData) => api.post("/orders", orderData);
export const getUserOrders = () => api.get("/orders/user");
export const getAllOrders = () => api.get("/orders/all");
export const getOrder = (orderId) => api.get(`/orders/${orderId}`);
export const updateOrderStatus = (orderId, status) => api.patch("/orders/status", { orderId, status });
export const getAvailableOrders = () => api.get("/orders/available");
export const pickupOrder = (orderId) => api.post("/orders/pickup", { orderId });
export const getPartnerOrders = () => api.get("/orders/partner");
export const completeDelivery = (orderId) => api.post("/orders/complete", { orderId });
export const requestOrderCancellation = (orderId, reason) => api.post("/orders/request-cancel", { orderId, reason });




export default api;
