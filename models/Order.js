const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  },
  cartItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  addressInfo: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    notes: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'razorpay']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String
}, {
  timestamps: true
});

module.exports = mongoose.model("Order", OrderSchema);
