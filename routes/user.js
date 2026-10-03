const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password -otp -otpExpires");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// UPDATE USER PROFILE
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, mobile } = req.body;

        // Check if at least one field is provided
        if (!name && !mobile) {
            return res.status(400).json({
                message: "Name or mobile is required"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update only allowed fields
        if (name) {
            user.name = name;
        }

        if (mobile) {
            user.mobile = mobile;
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;