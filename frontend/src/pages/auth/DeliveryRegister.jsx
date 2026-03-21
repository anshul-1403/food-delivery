import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerDelivery } from "../../services/api";
import "./DeliveryRegister.css";

const DeliveryRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cnf_password: "",
    phone: "",
    address: "",
    vehicleId: "",
    vehicleType: "Bike"
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerDelivery(formData);
      toast.success("Application successful! Wait for admin approval.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="delivery-reg-page">
      <div className="delivery-reg-card">
        <div className="delivery-reg-header">
          <h1>Join BiteDash Fleet 🚴</h1>
          <p>Register as a Delivery Partner and Start Earning</p>
        </div>

        <form onSubmit={handleSubmit} className="delivery-reg-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="Ankur Singh" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="ankur@example.com" required onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" placeholder="9876543210" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <select name="vehicleType" required onChange={handleChange}>
                <option value="Bike">Bike</option>
                <option value="Scooty">Scooty</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Vehicle Number (Indian Format: MH12AB1234)</label>
            <input type="text" name="vehicleId" placeholder="MP04AB1234" required onChange={handleChange} style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label>Current Address</label>
            <textarea name="address" placeholder="Enter your full address" required onChange={handleChange}></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="cnf_password" placeholder="••••••••" required onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn-delivery-reg">Submit Application</button>
        </form>

        <div className="delivery-reg-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRegister;
