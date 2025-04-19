const Product = require("../../models/Product");

const getFilteredProducts = async (req, res) => {
  try {
    const { 
      category = [], 
      brand = [], 
      sortBy = "price-lowtohigh",
      page = 1,
      limit = 12
    } = req.query;

    let filters = {};

    // More efficient filtering using $and to combine multiple conditions
    const conditions = [];
    
    if (category.length) {
      conditions.push({ category: { $in: category.split(",") } });
    }

    if (brand.length) {
      conditions.push({ brand: { $in: brand.split(",") } });
    }

    if (conditions.length > 0) {
      filters.$and = conditions;
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      default:
        sort.price = 1;
        break;
    }

    // Add pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Product.countDocuments(filters);
    
    // Get paginated products
    const products = await Product.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching products"
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!"
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching product details"
    });
  }
};

module.exports = { getFilteredProducts, getProductDetails };
