const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Restaurant = require('../models/Restaurant');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users/approve/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.approved = true;
    await user.save();
    res.json({ message: 'User approved' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tasks/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId })
      .populate('restaurantId', 'name phone address');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/restaurants', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/restaurants/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('reviewedBy', 'username');
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/restaurants/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    restaurant.reviewStatus = status;
    await restaurant.save();
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/restaurants/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    await Task.deleteMany({ restaurantId: req.params.id });
    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;