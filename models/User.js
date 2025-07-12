
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google user
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'rider', 'admin'],
    default: 'customer'
  },
  addresses: [{
    label: String,
    address: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  vendorInfo: {
    businessName: String,
    businessAddress: String,
    businessPhone: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  riderInfo: {
    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car']
    },
    vehicleNumber: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      lat: Number,
      lng: Number
    },
    rating: {
      type: Number,
      default: 5.0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
