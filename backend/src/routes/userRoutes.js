const express = require("express");
const { protect } = require("../middleware/auth");
const uploadImage = require("../middleware/uploadImage");
const { updateProfile, uploadAvatar } = require("../controllers/userController");

const router = express.Router();

router.use(protect);

router.patch("/profile", updateProfile);
router.post("/avatar", uploadImage.single("avatar"), uploadAvatar);

module.exports = router;
