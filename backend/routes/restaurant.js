const express = require('express');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, phone, address, latitude, longitude } = req.body;

    if (!name || !phone || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'All fields (name, phone, address, latitude, longitude) are required' });
    }

    const restaurant = new Restaurant({
      name,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    await restaurant.save();
    res.status(201).json({ message: 'Restaurant created', restaurant });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;