import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Typography, Paper, Button, Box, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { getOrder } from "../../services/api";

const ConfirmedBooking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrder(orderId);
        setOrder(response.data);
      } catch (error) {
        console.error("Fetch Order Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return (
    <Container sx={{ mt: 10, textAlign: "center" }}>
      <CircularProgress color="error" />
    </Container>
  );

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 10, textAlign: "center" }}>
      <Paper elevation={6} sx={{ p: 6, borderRadius: 8, bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 100, mb: 4 }} />
        <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold", color: "#27ae60" }}>
          Order Confirmed!
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
          Thank you for your order! Your meal is being prepared.
        </Typography>

        <Box sx={{ bgcolor: "var(--secondary-bg)", p: 3, borderRadius: 4, mb: 4, textAlign: "left" }}>
          <Typography variant="body1" sx={{ fontWeight: "600", mb: 1 }}>
            Order ID: {orderId}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Payment Method: <strong>{order?.paymentMethod}</strong>
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Payment Status: <strong style={{ color: order?.paymentStatus === "Paid" ? "#27ae60" : "#e67e22" }}>{order?.paymentStatus}</strong>
          </Typography>
          {order?.paymentId && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Payment ID: {order.paymentId}
            </Typography>
          )}
        </Box>


        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            component={Link}
            to={`/track/${orderId}`}
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold" }}
          >
            Track Order
          </Button>
          <Button
            component={Link}
            to="/foods"
            variant="outlined"
            size="large"
            fullWidth
            sx={{ py: 1.5, borderRadius: 2, fontWeight: "bold" }}
          >
            Order More
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ConfirmedBooking;
