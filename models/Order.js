
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderType: {
    type: String,
    enum: ['food', 'parcel'],
    required: true
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    notes: String
  }],
  deliveryAddress: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pickupAddress: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryTime: String,
  deliveryType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amounts: {
    subtotal: Number,
    deliveryFee: Number,
    tax: Number,
    total: Number
  },
  notes: String,
  rating: {
    customer: {
      rating: Number,
      comment: String
    },
    vendor: {
      rating: Number,
      comment: String
    }
  },
  trackingUpdates: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      lat: Number,
      lng: Number
    }
  }]
}, {
  timestamps: true
});

// Generate order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'NZJ-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
