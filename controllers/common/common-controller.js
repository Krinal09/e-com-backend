const FeatureImage = require("../../models/FeatureImage");

const getFeatureImages = async (req, res) => {
  try {
    const images = await FeatureImage.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching feature images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature images",
    });
  }
};

const addFeatureImage = async (req, res) => {
  try {
    const { image } = req.body;
    const newImage = await FeatureImage.create({ image });
    res.status(201).json({
      success: true,
      data: newImage,
    });
  } catch (error) {
    console.error("Error adding feature image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add feature image",
    });
  }
};

module.exports = {
  getFeatureImages,
  addFeatureImage,
}; 