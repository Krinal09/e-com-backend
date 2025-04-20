const mongoose = require("mongoose");

const featureImageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FeatureImage", featureImageSchema); 