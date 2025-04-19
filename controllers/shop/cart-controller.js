const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, paymentMethod = "COD" } = req.body;

    // Validate required fields
    if (!userId || !productId || !quantity || userId === null || userId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID, product ID, and quantity are required",
      });
    }

    // Validate payment method
    if (paymentMethod && !["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Must be either COD or ONLINE",
      });
    }

    // Validate MongoDB ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID or product ID",
      });
    }

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity. Quantity must be greater than 0",
      });
    }

    // Find product and validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.totalStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.totalStock} items available in stock`,
      });
    }

    // Try to find existing cart
    let cart = await Cart.findOne({ userId });

    // If no cart exists, create a new one
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        paymentMethod
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex === -1) {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        salePrice: product.salePrice || 0,
      });
    } else {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.totalStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.totalStock} items available in stock`,
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
      cart.items[existingItemIndex].salePrice = product.salePrice || 0;
    }

    // Save cart
    await cart.save();

    // Populate cart with product details
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.productId",
      select: "title price salePrice totalStock image",
    });

    res.status(200).json({
      success: true,
      data: populatedCart,
    });
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === null || userId === undefined || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "title price salePrice totalStock image",
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          userId,
          items: [],
          totalAmount: 0,
        },
      });
    }

    // Remove items with deleted products
    const validItems = cart.items.filter((item) => item.productId);
    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("fetchCartItems error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateCartItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (
      !userId ||
      !productId ||
      quantity <= 0 ||
      userId === null ||
      userId === undefined ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID, product ID, and quantity are required",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "totalStock",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const product = cart.items[itemIndex].productId;
    if (quantity > product.totalStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.totalStock} items available in stock`,
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.productId",
      select: "title price salePrice totalStock image",
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    console.error("updateCartItemQty error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (
      !userId ||
      !productId ||
      userId === null ||
      userId === undefined ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID and product ID are required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.productId",
      select: "title price salePrice totalStock image",
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
    });
  } catch (error) {
    console.error("deleteCartItem error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  fetchCartItems,
  updateCartItemQty,
  deleteCartItem,
  clearCart,
};
