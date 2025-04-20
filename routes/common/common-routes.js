const express = require("express");
const router = express.Router();
const { getFeatureImages, addFeatureImage } = require("../../controllers/common/common-controller");

router.get("/feature/get", getFeatureImages);
router.post("/feature/add", addFeatureImage);

module.exports = router; 