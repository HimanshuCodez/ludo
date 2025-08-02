const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, phone, referral } = req.body;

    // Check if already exists
    let user = await User.findOne({ phone });
    if (user) return res.status(200).json({ message: "Already registered" });

    // Save user
    user = new User({ name, phone, referral });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
