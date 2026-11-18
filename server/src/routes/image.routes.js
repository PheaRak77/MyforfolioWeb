const router = require("express").Router();
const { getStoredImage } = require("../controllers/upload.controller");

router.get("/:id", getStoredImage);

module.exports = router;
