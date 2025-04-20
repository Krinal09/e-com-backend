const FeatureImage = require("../../models/FeatureImage");

const getFeatureImages = async (req, res) => {
  try {
    const images = await FeatureImage.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Feature images fetched successfully",
      data: images,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching feature images",
      error: error.message,
    });
  }
};

const addFeatureImage = async (req, res) => {
  try {
    const { image } = req.body;
    const newImage = await FeatureImage.create({ image });
    return res.status(201).json({
      success: true,
      message: "Feature image added successfully",
      data: newImage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error adding feature image",
      error: error.message,
    });
  }
};

module.exports = {
  getFeatureImages,
  addFeatureImage,
}; 
