import express from "express";
import User from "../models/user.model.js"; // make sure this file exists

const router = express.Router();

// GET /api/users — return all users (you can customize this)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // remove password field
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
