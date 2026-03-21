import { NavLink } from "react-router-dom";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import "./Footer.css";
const Footer = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (user?.role === "admin") {
    return (
      <footer className="footer-admin">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 style={{ color: "#e74c3c" }}>BiteDash Admin</h2>
            <p>Internal Control Center v2.4</p>
          </div>
          <div className="footer-nav">
            <h3>Management</h3>
            <NavLink to="/admin" className="footer-navlink">Orders</NavLink>
            <NavLink to="/admin" className="footer-navlink">Inventory</NavLink>
            <NavLink to="/admin/messages" className="footer-navlink">Support Inbox</NavLink>
          </div>
          <div className="footer-support">
            <h3>Admin Support</h3>
            <p>System Status: <span style={{ color: "#2ecc71" }}>Online</span></p>
            <p>Tech Help: tech@bitedash.com</p>
          </div>
        </div>
      </footer>
    );
  }

  if (user?.role === "delivery") {
    return (
      <footer className="footer-delivery">
         <div className="footer-content">
          <div className="footer-brand">
            <h2 style={{ color: "#2ecc71" }}>Partner Dashboard</h2>
            <p>Proudly Delivering Flavor</p>
          </div>
          <div className="footer-nav">
            <h3>Quick Actions</h3>
            <NavLink to="/delivery" className="footer-navlink">My Tasks</NavLink>
            <NavLink to="/delivery" className="footer-navlink">Earnings</NavLink>
            <NavLink to="/delivery" className="footer-navlink">Help Center</NavLink>
          </div>
          <div className="footer-help">
            <h3>Partner Support</h3>
            <p>📞 1800-BITEDASH-HELP</p>
            <p>Safety first: 911 (Emergency)</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer-customer">
      <div className="footer-content">
        <div className="footer-section">
          <h2>BiteDash</h2>
          <p>Delivering India's favorite flavors at your doorstep since 2024.</p>
        </div>
        <div className="footer-nav">
          <h3>Quick Links</h3>
          <NavLink to="/" className="footer-navlink">Home</NavLink>
          <NavLink to="/about" className="footer-navlink">About Us</NavLink>
          <NavLink to="/contact" className="footer-navlink">Contact Support</NavLink>
        </div>
        <div className="footer-social">
          <h3>Follow BiteDash</h3>
          <div className="footer-social-icons">
            <p className="facebook-icon"> <FacebookIcon /> </p>
            <p className="insta-icon"> <InstagramIcon /> </p>
            <p className="twitter-icon"> <TwitterIcon /> </p>
            <p className="linkdin-icon"> <LinkedInIcon /> </p>
          </div>
        </div>
      </div>
      <p className="footer-copy">© 2024 BiteDash. All rights reserved.</p>
    </footer>
  );
};




export default Footer;
