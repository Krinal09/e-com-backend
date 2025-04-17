// // const paypal = require("../../helpers/paypal");
// const razorpay = require("../../helpers/razorpay");
// const Order = require("../../models/Order");
// const Cart = require("../../models/Cart");
// const Product = require("../../models/Product");

// const createOrder = async (req, res) => {
//   try {
//     const {
//       userId,
//       cartItems,
//       addressInfo,
//       orderStatus = "pending",
//       paymentMethod = "paypal",
//       paymentStatus = "pending",
//       totalAmount,
//       orderDate = new Date(),
//       orderUpdateDate = new Date(),
//       cartId,
//     } = req.body;

//     const create_payment_json = {
//       intent: "sale",
//       payer: {
//         payment_method: "paypal",
//       },
//       redirect_urls: {
//         return_url: "http://localhost:5173/shop/paypal-return",
//         cancel_url: "http://localhost:5173/shop/paypal-cancel",
//       },
//       transactions: [
//         {
//           item_list: {
//             items: cartItems.map((item) => ({
//               name: item.title,
//               sku: item.productId,
//               price: item.price.toFixed(2),
//               currency: "INR",
//               quantity: item.quantity,
//             })),
//           },
//           amount: {
//             currency: "INR",
//             total: totalAmount.toFixed(2),
//           },
//           description: "E-commerce Order Payment",
//         },
//       ],
//     };

//     paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
//       if (error) {
//         console.error("PayPal create payment error:", error);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to create PayPal payment",
//         });
//       }

//       const approvalURL = paymentInfo.links.find(
//         (link) => link.rel === "approval_url"
//       )?.href;

//       const newOrder = new Order({
//         userId,
//         cartId,
//         cartItems,
//         addressInfo,
//         orderStatus,
//         paymentMethod,
//         paymentStatus,
//         totalAmount,
//         orderDate,
//         orderUpdateDate,
//         paymentId: "",
//         payerId: "",   
//       });

//       await newOrder.save();

//       res.status(201).json({
//         success: true,
//         approvalURL,
//         orderId: newOrder._id,
//       });
//     });
//   } catch (err) {
//     console.error("Create order error:", err);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while creating the order.",
//     });
//   }
// };

// const capturePayment = async (req, res) => {
//   try {
//     const { paymentId, payerId, orderId } = req.body;

//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     // Execute PayPal payment (optional: validate with PayPal API)
//     const execute_payment_json = {
//       payer_id: payerId,
//     };

//     paypal.payment.execute(paymentId, execute_payment_json, async (err, payment) => {
//       if (err) {
//         console.error("Payment execution error:", err.response);
//         return res.status(500).json({
//           success: false,
//           message: "Failed to capture PayPal payment",
//         });
//       }

//       // Update order status and stock
//       order.paymentStatus = "paid";
//       order.orderStatus = "confirmed";
//       order.paymentId = paymentId;
//       order.payerId = payerId;

//       for (let item of order.cartItems) {
//         const product = await Product.findById(item.productId);
//         if (!product || product.totalStock < item.quantity) {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough stock for ${item.title}`,
//           });
//         }

//         product.totalStock -= item.quantity;
//         await product.save();
//       }

//       if (order.cartId) {
//         await Cart.findByIdAndDelete(order.cartId);
//       }

//       await order.save();

//       res.status(200).json({
//         success: true,
//         message: "Payment captured and order confirmed",
//         data: order,
//       });
//     });
//   } catch (err) {
//     console.error("Capture payment error:", err);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while capturing payment.",
//     });
//   }
// };

// const getAllOrdersByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const orders = await Order.find({ userId });

//     res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch orders",
//     });
//   }
// };

// const getOrderDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const order = await Order.findById(id);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: order,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch order details",
//     });
//   }
// };

// module.exports = {
//   createOrder,
//   capturePayment,
//   getAllOrdersByUser,
//   getOrderDetails,
// };


require("dotenv").config();
const razorpay = require("../../helpers/razorpay");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress } = req.body;

    if (!userId || !items || !totalAmount || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create order
    const order = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      status: "pending",
    });

    // Save order
    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }
    );

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const fetchUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
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

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
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

module.exports = {
  createOrder,
  fetchUserOrders,
  updateOrderStatus,
};