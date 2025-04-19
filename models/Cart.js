const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      validate: {
        validator: function (value) {
          return value != null && mongoose.Types.ObjectId.isValid(value);
        },
        message: "Valid User ID is required",
      },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value",
          },
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
        salePrice: {
          type: Number,
          min: [0, "Sale price cannot be negative"],
          default: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, "Total amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
  },
  {
    timestamps: true,
  }
);

// Drop all existing indexes when the model is compiled
CartSchema.pre('save', async function(next) {
  try {
    const collection = this.collection;
    const indexes = await collection.indexes();
    
    // Drop all non-_id indexes
    for (let index of indexes) {
      if (index.name !== '_id_') {
        await collection.dropIndex(index.name);
      }
    }
    next();
  } catch (error) {
    console.warn('Error dropping indexes:', error);
    next();
  }
});

// Add a non-unique index on userId for better query performance
CartSchema.index({ userId: 1 }, { unique: false });

// Calculate total amount before saving
CartSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((total, item) => {
    const price = item.salePrice > 0 ? item.salePrice : item.price;
    return total + price * item.quantity;
  }, 0);
  next();
});

// Validate userId before saving
CartSchema.pre("save", function (next) {
  if (!this.userId || this.userId == null || !mongoose.Types.ObjectId.isValid(this.userId)) {
    console.error("CartSchema.pre(save) - Invalid userId:", this.userId);
    return next(new Error("Valid User ID is required"));
  }
  next();
});

const Cart = mongoose.model("Cart", CartSchema);

// Ensure indexes are dropped and recreated when the model is compiled
Cart.collection.dropIndexes().catch(err => {
  console.warn('Error dropping indexes during model compilation:', err);
});

module.exports = Cart;
