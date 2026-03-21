import "./Hero.css";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;


  const logoutUser = () => {
    localStorage.removeItem("user");
    location.reload();
  };

  return (
    <div className="hero-section">
      <div className="hero-title">
        <h1>
          BiteDash's Delicious Food, <br /> delivered right at your doorstep!
        </h1>
        <p>
          Experience the rich and delectable world of BiteDash's cuisine at your
          fingertips with the BiteDash Food Delivery App! Indulge in the
          authentic flavors of India's favorite snacks, sweets, and savories,
          all conveniently delivered to your doorstep.
        </p>

        <div>
          {(!parsedUser || parsedUser.role === "customer") && (
            <button
              className="order-now-btn"
              onClick={() => navigate(parsedUser ? "/foods" : "/login")}
            >
              {parsedUser ? "Start Ordering" : "Login now"}
            </button>
          )}
          {parsedUser && (
            <button 
              style={{marginLeft: (!parsedUser || parsedUser.role === "customer") ? '10px' : '0'}} 
              className="order-now-btn" 
              onClick={() => logoutUser()}
            >
              {"Logout"}
            </button>
          )}
        </div>

      </div>
      <div className="hero-image">
        <img
          src="https://food-delivery-app-frontend-snowy.vercel.app/static/media/location.c2a808618ecbf53c92bc.png"
          alt=""
        />
      </div>
    </div>
  );
};

export default Hero;
