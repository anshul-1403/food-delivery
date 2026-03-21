import { useState, useEffect, useMemo } from "react";
import FoodBankIcon from "@mui/icons-material/FoodBank";
import { DiningSharp, EmojiFoodBeverage, Search } from "@mui/icons-material";
import { TextField, InputAdornment, Box, Select, MenuItem, FormControl, InputLabel, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./Shop.css";
import { getDishes } from "../../services/api";
import Foods from "../foods/Foods";

const Shop = () => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    if (user?.role === "delivery") {
      navigate("/delivery");
      return;
    }
    if (user?.role === "admin") {
      navigate("/admin");
      return;
    }
    
    async function fetchData() {
      try {
        const response = await getDishes();
        setAllProducts(response.data);
      } catch (error) {
        console.error("Fetch Data Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  const displayedProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Filter by Category
    if (category !== "all") {
      filtered = filtered.filter(item => item.category?.toLowerCase() === category);
    }

    // Filter by Search Term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "priceLow") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHigh") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [allProducts, category, searchTerm, sortBy]);

  if (loading) return <div className="loading" style={{ marginTop: '100px', textAlign: 'center' }}>Loading your menu...</div>;

  return (
    <div className="shop-container" style={{ marginTop: "70px", padding: "0 20px" }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Category Icons */}
        <div className="latest-nav" style={{ margin: 0 }}>
          <div onClick={() => setCategory("all")} className={`category-text ${category === "all" ? "active" : ""}`}>
            <FoodBankIcon />
            <span>All</span>
          </div>
          <div onClick={() => setCategory("food")} className={`category-text ${category === "food" ? "active" : ""}`}>
            <DiningSharp />
            <span>Food</span>
          </div>
          <div onClick={() => setCategory("beverages")} className={`category-text ${category === "beverages" ? "active" : ""}`}>
            <EmojiFoodBeverage />
            <span>Drinks</span>
          </div>
        </div>

        {/* Search and Sort */}
        <Box sx={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'flex-end', width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder="Search for delicacies..."
            size="small"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="priceLow">Price: Low to High</MenuItem>
              <MenuItem value="priceHigh">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {displayedProducts.length > 0 ? (
        <Foods data={displayedProducts} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="textSecondary">No items found matching your criteria.</Typography>
        </Box>
      )}
    </div>
  );
};

export default Shop;
