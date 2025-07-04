const express = require('express');
const Restaurant = require('../models/Restaurant');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/user/restaurants/:restaurantId
router.get('/restaurants/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId)
      .select('name phone address location reviewStatus images reviewImages reviewedBy')
      .populate('reviewedBy', 'username');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.status(200).json(restaurant);
  } catch (err) {
    console.error('Error fetching restaurant:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/user/tasks/review/:taskId
router.post('/tasks/review/:taskId', authMiddleware, async (req, res) => {
  try {
    const { fssaiImage, menuImage, bannerImage } = req.body;

    if (!fssaiImage || !menuImage || !bannerImage) {
      return res.status(400).json({ error: 'All images (fssai, menu, banner) are required' });
    }

    // Validate URLs
    const validateUrl = (url) => url && url.startsWith('https://res.cloudinary.com/');
    if (!validateUrl(fssaiImage) || !validateUrl(menuImage) || !validateUrl(bannerImage)) {
      return res.status(400).json({ error: 'Invalid image URLs' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to review this task' });
    }

    const restaurant = await Restaurant.findById(task.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    task.status = 'completed';
    task.reviewDate = new Date();
    task.images = { fssai: fssaiImage, menu: menuImage, banner: bannerImage };
    await task.save();

    restaurant.reviewStatus = 'completed';
    restaurant.images = { fssai: fssaiImage, menu: menuImage, banner: bannerImage };
    restaurant.reviewImages = [fssaiImage, menuImage, bannerImage];
    restaurant.reviewedBy = req.user._id;
    await restaurant.save();

    const user = await User.findById(req.user._id);
    user.tasksCompleted += 1;
    await user.save();

    res.json({ message: 'Review submitted' });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

// Other routes (unchanged)
router.get('/restaurants', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const restaurants = await Restaurant.find({ reviewStatus: 'not_started' })
      .limit(200)
      .lean();

    const haversine = (lat1, lng1, lat2, lng2) => {
      const toRad = x => x * Math.PI / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const sortedRestaurants = restaurants
      .map(r => ({
        ...r,
        distance: haversine(lat, lng, r.location.coordinates[1], r.location.coordinates[0])
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json(sortedRestaurants);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/tasks/assign/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    if (restaurant.reviewStatus !== 'not_started') {
      return res.status(400).json({ error: 'Restaurant already assigned' });
    }

    const task = new Task({
      userId: req.user._id,
      restaurantId: req.params.restaurantId,
      status: 'pending'
    });
    await task.save();

    restaurant.reviewStatus = 'pending';
    await restaurant.save();

    res.json({ message: 'Task assigned' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tasks/pending', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'pending' })
      .populate('restaurantId', 'name phone address location');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tasks/completed', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, status: 'completed' })
      .populate('restaurantId', 'name phone address')
      .sort({ reviewDate: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;