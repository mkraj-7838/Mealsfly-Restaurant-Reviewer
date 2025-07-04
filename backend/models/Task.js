const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  reviewDate: Date,
  images: {
    fssai: String,
    menu: String,
    banner: String
  }
});

module.exports = mongoose.model('Task', taskSchema);