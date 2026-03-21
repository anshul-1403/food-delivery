const express = require("express");

const router = express.Router();

const { 
  getDishes, 
  addDish, 
  deleteDish, 
  updateDish 
} = require("../controllers/dishController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

router.get("/dishes", getDishes);
router.post("/dishes/add", authMiddleware, adminMiddleware, addDish);
router.delete("/dishes/:id", authMiddleware, adminMiddleware, deleteDish);
router.patch("/dishes/:id", authMiddleware, adminMiddleware, updateDish);


module.exports = router;
