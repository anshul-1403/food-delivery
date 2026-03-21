import { toast } from "react-toastify";
import "./Food.css";

const Foods = ({ data }) => {
  const addItem = (item) => {
    let existingCart = [];
    const localCart = localStorage.getItem("cart");
    if (localCart) {
      existingCart = JSON.parse(localCart);
    }
    
    let cartCopy = [...existingCart];
    // Use _id (from MongoDB) or id (from seed/JSON)
    const itemId = item._id || item.id;
    
    let existingItem = cartCopy.find((cartItem) => (cartItem._id || cartItem.id) === itemId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartCopy.push({ ...item, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cartCopy));
    
    // Dispatch custom event for Navbar to update count
    window.dispatchEvent(new Event("cartUpdated"));
    
    toast.success(`${item.name} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const handleAddFood = (item) => {
    addItem(item);
  };

  return (
    <div className="food-list">
      {data.map((item) => (
        <div key={item._id || item.id} className="food">
          <img src={item.img} width="15%" alt={item.name} />
          <p className="food-name">{item.name}</p>
          <div className="food-footer">
            <span className="food-price">Rs. {item.price}</span>
            <span>Delivery free</span>
          </div>

          <button className="add-food" onClick={() => handleAddFood(item)}>
            Add
          </button>
        </div>
      ))}
    </div>
  );
};

export default Foods;

