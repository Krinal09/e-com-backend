const express = require("express");

const {
  createOrder,
  fetchUserOrders,
  updateOrderStatus,
  getOrderDetails,
} = require("../../controllers/shop/order-controller");

const router = express.Router();

router.post("/create", createOrder);
router.get("/list/:userId", fetchUserOrders);
router.put("/update/:orderId", updateOrderStatus);
router.get("/details/:id", getOrderDetails);

module.exports = router;
