
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  category: String,
  image: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: Number, // in minutes
  ingredients: [String],
  allergens: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
