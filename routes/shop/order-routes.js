const express = require("express");

const {
  createOrder,
  fetchUserOrders,
  updateOrderStatus,
} = require("../../controllers/shop/order-controller");

const router = express.Router();

router.post("/create", createOrder);
router.get("/list/:userId", fetchUserOrders);
router.put("/update/:orderId", updateOrderStatus);

module.exports = router;