const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "profile_images",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};

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

router.put(
    "/profile/image",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "Profile image is required"
                });
            }

            const user = await User.findById(req.user.userId);

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            const result = await uploadToCloudinary(req.file.buffer);

            if (user.profileImage.public_id) {
                await cloudinary.uploader.destroy(
                    user.profileImage.public_id
                );
            }

            user.profileImage.secure_url = result.secure_url;
            user.profileImage.public_id = result.public_id;

            await user.save();

            res.status(200).json({
                message: "Profile image uploaded successfully",
                profileImage: {
                    secure_url: user.profileImage.secure_url,
                    public_id: user.profileImage.public_id
                }
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Profile image upload failed"
            });
        }
    }
);

module.exports = router;