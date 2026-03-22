import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Box,
  CircularProgress,
  Button,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { subscribeToStatusUpdates, joinOrder, connectSocket, disconnectSocket } from "../../services/socket";
import { getOrder } from "../../services/api";

import ChatPanel from "../../components/chat/ChatPanel";

const steps = ["Placed", "Confirmed", "Cooking", "Ready to Deliver", "Out for Delivery", "Delivered"];

const statusMessages = {
  "Placed": "Your order has been placed successfully.",
  "Confirmed": "The restaurant has confirmed your order.",
  "Cooking": "Our chefs are preparing your delicious meal.",
  "Ready to Deliver": "Your order is packed and ready! A delivery partner will pick it up shortly.",
  "Out for Delivery": "Your food is on the way! Get ready.",
  "Delivered": "Enjoy your meal! Your order has been delivered.",
  "Cancelled": "This order has been cancelled."
};

const Tracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrder(orderId);
        const data = response.data;
        setOrder(data);
        const stepIndex = steps.indexOf(data.status);
        if (stepIndex !== -1) {
          setActiveStep(stepIndex);
        }
        // Auto-open chat if already out for delivery
        if (data.status === "Out for Delivery") {
          setShowChat(true);
        }
      } catch (error) {
        console.error("Fetch Order Error:", error);
      } finally {
        setLoading(false);
      }
    };


    fetchOrder();
    connectSocket();
    joinOrder(orderId);

    subscribeToStatusUpdates((data) => {
      setOrder(data);
      const stepIndex = steps.indexOf(data.status);
      if (stepIndex !== -1) setActiveStep(stepIndex);
      // Auto-open chat when delivery partner picks up
      if (data.status === "Out for Delivery") setShowChat(true);
      // Auto-close when delivered
      if (data.status === "Delivered") setShowChat(false);
    });

    return () => {
      disconnectSocket();
    };
  }, [orderId]);


  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 4, bgcolor: "var(--card-bg)", color: "var(--text-color)" }}>
        <Typography variant="h4" gutterBottom sx={{ color: "#e74c3c", fontWeight: "bold" }}>
          Live Tracking
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, opacity: 0.8 }}>
          Order ID: {orderId}
        </Typography>

        {loading ? (
          <CircularProgress color="error" />
        ) : order && order.status === "Cancelled" ? (
          <Box sx={{ my: 4 }}>
             <Typography variant="h6" color="error" gutterBottom>
              This order has been cancelled.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Please contact support if you have any questions.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: "100%", mt: 4 }}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel 
                sx={{ 
                  "& .MuiStepLabel-label": { 
                    color: "var(--text-color) !important",
                    opacity: 0.7
                  }, 
                  "& .MuiStepLabel-label.Mui-active": { 
                    color: "var(--text-color) !important",
                    opacity: 1,
                    fontWeight: "bold"
                  },
                  "& .MuiStepLabel-label.Mui-completed": { 
                    color: "var(--text-color) !important",
                    opacity: 1
                  },
                  "& .MuiStepIcon-root": { 
                    color: "#ccc",
                    "&.Mui-active": { color: "#e74c3c" },
                    "&.Mui-completed": { color: "#e74c3c" }
                  },
                  "& .MuiStepIcon-text": { 
                    fill: "white" 
                  } 
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box sx={{ mt: 6 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {statusMessages[order?.status] || "Your order is being processed."}
              </Typography>
              {order?.deliveryPartner && (
                <Paper variant="outlined" sx={{ p: 2, display: "inline-block", mt: 2, bgcolor: "rgba(129, 199, 132, 0.1)", borderColor: "#81c784", color: "var(--text-color)" }}>
                   <Typography variant="body2">
                    Delivery Partner: <strong>{order.deliveryPartner.name}</strong>
                  </Typography>
                </Paper>
              )}
              {order?.status === "Out for Delivery" && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setShowChat(true)}
                    startIcon={<ChatIcon />}
                    sx={{ borderRadius: 4, bgcolor: "#e74c3c" }}
                  >
                    Contact Delivery Partner
                  </Button>
                </Box>
              )}
            </Box>
          </>


        )}

        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate("/my-orders")}
            sx={{ bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" } }}
          >
            Back to My Orders
          </Button>
        </Box>
      </Paper>

      {/* Floating delivery chat */}
      {showChat && order && (
        <ChatPanel
          orderId={orderId}
          myRole="customer"
          isActive={order.status !== "Delivered"}
          onClose={() => setShowChat(false)}
        />
      )}
    </Container>
  );
};


export default Tracking;
