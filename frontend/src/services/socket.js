import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinOrder = (orderId) => {
  socket.emit("join_order", orderId);
};

export const subscribeToStatusUpdates = (callback) => {
  socket.on("order_status_update", (data) => {
    callback(data);
  });
};

