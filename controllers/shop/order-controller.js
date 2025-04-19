require("dotenv").config();
const razorpay = require("../../helpers/razorpay");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const mongoose = require("mongoose");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartId,
      cartItems,
      addressInfo,
      paymentMethod,
      totalAmount,
    } = req.body;

    // Validate required fields
    if (
      !userId ||
      userId === null ||
      userId === undefined ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !paymentMethod ||
      !totalAmount ||
      typeof totalAmount !== "number" ||
      totalAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID, payment method, and total amount are required",
      });
    }

    // Validate cart items
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    // Validate address
    if (
      !addressInfo ||
      !addressInfo.address ||
      !addressInfo.city ||
      !addressInfo.pincode ||
      !addressInfo.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Create order
    const order = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      totalAmount,
    });

    await order.save();

    // Clear cart items used in the order
    if (cartId) {
      const cart = await Cart.findById(cartId);
      if (cart) {
        // Filter out the items that were ordered
        cart.items = cart.items.filter((cartItem) =>
          !cartItems.some((orderItem) => orderItem.productId.toString() === cartItem.productId.toString())
        );
        await cart.save();
      }
    }

    // If COD, return success immediately
    if (paymentMethod === "cod") {
      return res.status(200).json({
        success: true,
        message: "Order placed successfully with COD",
        data: order,
      });
    }

    // For Razorpay, proceed with payment
    if (paymentMethod === "razorpay") {
      try {
        const options = {
          amount: Math.round(totalAmount * 100), // Convert to paise
          currency: "INR",
          receipt: order._id.toString(),
          payment_capture: 1,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Update order with Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return res.status(200).json({
          success: true,
          message: "Razorpay order created",
          data: {
            order: order,
            razorpayOrder: razorpayOrder,
          },
        });
      } catch (error) {
        console.error("Razorpay order creation error:", error);
        // Update order status to failed
        order.paymentStatus = "failed";
        await order.save();

        return res.status(500).json({
          success: false,
          message: "Failed to create Razorpay order",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const fetchUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === null || userId === undefined || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "cartItems.productId",
        select: "title image price salePrice",
      });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Valid order ID and status are required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    ).populate({
      path: "items.productId",
      select: "title image price salePrice",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order ID is required",
      });
    }

    const order = await Order.findById(id)
      .populate({
        path: "cartItems.productId",
        select: "title image price salePrice description",
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createOrder,
  fetchUserOrders,
  updateOrderStatus,
  getOrderDetails,
};
