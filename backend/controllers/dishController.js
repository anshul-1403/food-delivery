const DishesModel = require("../models/Dishes");

const getDishes = async (req, res) => {
  const results = await DishesModel.find({});
  return res.status(200).send(results);
};

const addDish = async (req, res) => {
  try {
    const { name, img, category, price, quantity } = req.body;
    const newDish = new DishesModel({ name, img, category, price, quantity });
    const savedDish = await newDish.save();
    return res.status(201).json(savedDish);
  } catch (error) {
    console.error("Add Dish Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    await DishesModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "Dish deleted successfully" });
  } catch (error) {
    console.error("Delete Dish Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDish = await DishesModel.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updatedDish);
  } catch (error) {
    console.error("Update Dish Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getDishes,
  addDish,
  deleteDish,
  updateDish,
};

