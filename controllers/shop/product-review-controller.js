const Order = require("../../models/Order");
const Product = require("../../models/Product");
const ProductReview = require("../../models/Review");

const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } = req.body;

    // Validate required fields
    if (!productId || !userId || !userName || !reviewMessage || !reviewValue) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user has purchased the product
    const order = await Order.findOne({
      userId,
      "cartItems.productId": productId,
      orderStatus: { $in: ["delivered", "confirmed"] },
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase and receive the product to review it.",
      });
    }

    // Check for existing review
    const existingReview = await ProductReview.findOne({
      productId,
      userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product!",
      });
    }

    // Create new review
    const newReview = new ProductReview({
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue,
    });

    await newReview.save();

    // Update product's average review
    const reviews = await ProductReview.find({ productId });
    const totalReviews = reviews.length;
    const averageReview = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.reviewValue, 0) / totalReviews
      : 0;

    await Product.findByIdAndUpdate(productId, { 
      averageReview: parseFloat(averageReview.toFixed(2))
    });

    res.status(201).json({
      success: true,
      data: newReview,
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the review",
      error: error.message,
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // First check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = await ProductReview.find({ productId })
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching reviews",
      error: error.message,
    });
  }
};

module.exports = { addProductReview, getProductReviews };
