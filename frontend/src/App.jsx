import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import About from "./pages/about/About";
import Contact from "./pages/contact/Contact";
import Home from "./pages/home/Home";
import Cart from "./pages/cart/Cart";
import Footer from "./components/footer/Footer";
import Shop from "./pages/shop/Shop";
import Login from "./pages/login/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Tracking from "./pages/order/Tracking";
import ConfirmedBooking from "./pages/order/ConfirmedBooking";
import MyOrders from "./pages/order/MyOrders";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import Profile from "./pages/profile/Profile";
import AdminMessages from "./pages/admin/AdminMessages";
import DeliveryRegister from "./pages/auth/DeliveryRegister";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <Navbar />


      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="foods" element={<Shop />} />
        <Route path="about" element={<About />} />
        <Route path="cart" element={<Cart />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register-delivery" element={<DeliveryRegister />} />
        <Route path="my-orders" element={<MyOrders />} />

        <Route path="admin" element={<AdminDashboard />} />
        <Route path="track/:orderId" element={<Tracking />} />
        <Route path="confirmed/:orderId" element={<ConfirmedBooking />} />
        <Route path="delivery" element={<DeliveryDashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin/messages" element={<AdminMessages />} />
      </Routes>

      <Footer />
    </Router>
  );
}
