import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Paper, Typography, TextField, Button, Box, Divider, Avatar, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Grid } from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { getProfile, updateProfile } from "../../services/api";
import { toast } from "react-toastify";

const Profile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    address: "", 
    phone: "", 
    profilePic: "", 
    addresses: [] 
  });
  const [email, setEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data } = await getProfile();
        setForm({ 
          name: data.name || "", 
          address: data.address || "", 
          phone: data.phone || "",
          profilePic: data.profilePic || "",
          addresses: data.addresses || []
        });
        setEmail(data.email || "");
      } catch (e) {
        toast.error("Failed to load profile");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { data } = await updateProfile(form);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...data }));
      toast.success("Profile saved successfully!");
    } catch (e) {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const addAddress = () => {
    if (!newAddress.trim()) return;
    setForm(prev => ({ ...prev, addresses: [...prev.addresses, newAddress.trim()] }));
    setNewAddress("");
  };

  const removeAddress = (index) => {
    const updated = [...form.addresses];
    updated.splice(index, 1);
    setForm(prev => ({ ...prev, addresses: updated }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid item xs={12} md={5}>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Avatar 
              src={form.profilePic} 
              sx={{ width: 120, height: 120, mx: "auto", mb: 2, border: '4px solid #e74c3c' }} 
            />
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>{form.name || "User Name"}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>{email}</Typography>
            
            <TextField
              fullWidth
              label="Profile Picture URL"
              value={form.profilePic}
              onChange={(e) => setForm({ ...form, profilePic: e.target.value })}
              margin="normal"
              placeholder="https://example.com/photo.jpg"
              size="small"
            />
            <Typography variant="caption" color="textSecondary">Paste an image URL to update your avatar</Typography>
          </Paper>
        </Grid>

        {/* Info and Address Book */}
        <Grid item xs={12} md={7}>
          <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Account Details</Typography>
            <form onSubmit={handleSave}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Primary Delivery Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                placeholder="Required for checkout"
              />
              <TextField
                fullWidth
                label="Mobile Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                margin="normal"
                placeholder="10-digit mobile"
              />

              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Address Book</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Add another address (Office, Mom's, etc.)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <Button variant="outlined" onClick={addAddress} startIcon={<AddIcon />}>Add</Button>
              </Box>
              
              <List dense sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                {form.addresses.length === 0 ? (
                  <ListItem><ListItemText secondary="No extra addresses added" /></ListItem>
                ) : (
                  form.addresses.map((addr, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={addr} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => removeAddress(i)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ mt: 4, bgcolor: "#e74c3c", "&:hover": { bgcolor: "#c0392b" }, borderRadius: 2, py: 1.5 }}
              >
                {loading ? "Saving..." : "Save All Changes"}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;

