const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  reviewStatus: { type: String, enum: ['completed', 'pending', 'not_started'], default: 'not_started' },
  images: {
    fssai: String,
    menu: String,
    banner: String
  },
  reviewImages: [String],
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);