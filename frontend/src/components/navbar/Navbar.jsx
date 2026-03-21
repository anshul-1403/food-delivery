import { NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import cart_icon from "../../images/food-cart-icon.png";
import "./Navbar.css";
import { useState, useEffect } from "react";
import { Badge, IconButton } from "@mui/material";
import { getAllMessages, getMyMessages } from "../../services/api";
import { connectSocket, socket } from "../../services/socket";

const Navbar = () => {
  const [menu, setMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeChatsCount, setActiveChatsCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const fetchUnreadCount = async () => {
    if (user?.role === "admin") {
      try {
        const { data } = await getAllMessages();
        const count = data.filter(m => !m.isRead && !m.isClosed).length;
        setUnreadMessages(count);
      } catch (e) {
        console.error(e);
      }
    } else if (user && user.role !== "delivery" && user.role !== "admin") {
      try {
        const { data } = await getMyMessages();
        const activeChats = data.filter(m => !m.isClosed).length;
        setActiveChatsCount(activeChats);
      } catch (e){ console.error(e); }
    }
  };

  const updateCartCount = () => {
    const localCart = localStorage.getItem("cart");
    if (localCart) {
      const cart = JSON.parse(localCart);
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);

    if (user && user.role !== "delivery") {
      fetchUnreadCount();
      connectSocket();
      socket.on("new_message_thread", fetchUnreadCount);
      socket.on("thread_updated", fetchUnreadCount);
      socket.on("message_closed", fetchUnreadCount);
    }

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      if (user && user.role !== "delivery") {
        socket.off("new_message_thread", fetchUnreadCount);
        socket.off("thread_updated", fetchUnreadCount);
        socket.off("message_closed", fetchUnreadCount);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    window.location.href = "/";
  };

  const handleChangeMenu = () => {
    setMenu(!menu);
  };

  return (
    <nav className={menu ? "nav-bar expand" : "nav-bar"}>
      <div className={menu ? "nav-1 visible" : "nav-1"}>
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/about" className="nav-link">
          About
        </NavLink>
        {(!user || (user.role !== "delivery" && user.role !== "admin")) && (
          <NavLink to="/foods" className="nav-link">
            Foods
          </NavLink>
        )}
        {(!user || (user.role !== "delivery" && user.role !== "admin")) && (
          <NavLink to="/contact" className="nav-link">
            {activeChatsCount > 0 ? (
              <Badge variant="dot" color="error" overlap="circular" sx={{ "& .MuiBadge-badge": { right: -6, top: 4 } }}>
                Contact
              </Badge>
            ) : "Contact"}
          </NavLink>
        )}

        {user && user.role !== "delivery" && user.role !== "admin" && (
          <NavLink to="/my-orders" className="nav-link">
            My Orders
          </NavLink>
        )}
        {user && user.role !== "delivery" && user.role !== "admin" && (
          <NavLink to="/profile" className="nav-link">
            My Profile
          </NavLink>
        )}
        {user && user.role === "admin" && (
          <NavLink to="/admin" className="nav-link" style={{ color: "#e74c3c", fontWeight: "bold" }}>
            Admin Panel
          </NavLink>
        )}

        {user && user.role === "admin" && (
          <NavLink to="/admin/messages" className="nav-link" style={{ color: "#e74c3c", fontWeight: "bold" }}>
             <Badge badgeContent={unreadMessages} color="error" sx={{ "& .MuiBadge-badge": { fontSize: '0.65rem', height: 16, minWidth: 16 } }}>
              Messages
            </Badge>
          </NavLink>
        )}

        {user && user.role === "delivery" && (
          <NavLink to="/delivery" className="nav-link" style={{ color: "#27ae60", fontWeight: "bold" }}>
            Delivery
          </NavLink>
        )}
        {!user && (
          <NavLink to="/register-delivery" className="nav-link partner-nav-link" style={{ color: "#2ecc71" }}>
            Become a Partner
          </NavLink>
        )}
      </div>


      <div className="nav-2">
        <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
          {theme === "light" ? <DarkModeIcon /> : <LightModeIcon sx={{ color: '#f1c40f' }} />}
        </IconButton>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span className="user-name-nav" style={{ fontSize: "0.9rem" }}>Hi, {user.name}</span>
            {user.role !== "delivery" && user.role !== "admin" && (
              <div className="cart-icon" style={{ position: "relative" }}>
                <NavLink to="/cart" className="nav-link cart-link">
                  <img src={cart_icon} alt="" />
                  {cartCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#e74c3c",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 6px",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}>
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              </div>
            )}

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="nav-link">
            Login
          </NavLink>
        )}
        <button className="menu" onClick={handleChangeMenu}>
          {menu ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

