const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const otpLimiter = require("../middleware/otpLimiter");
const jwt = require("jsonwebtoken");


const router = express.Router();

router.post("/signup", otpLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

   
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpires
        });

        await sendEmail.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP for Authentication",
            text: `Hello ${name},
               Your OTP is: ${otp}
               This OTP is valid for 10 minutes.
               Do not share this OTP with anyone.`
        });

        res.status(201).json({
            message: "User created successfully. OTP sent to your email."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});



router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        
        if (!email || !otp) {               // Checking required fields
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const user = await User.findOne({ email });    // Find user

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        
        if (user.isVerified) {       // Check is already verified ?
            return res.status(400).json({
                message: "User is already verified"
            });
        }

        
        if (user.otp !== otp) {             // Check OTP
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        if (user.otpExpires < new Date()) {          // Check OTP expiry
            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        user.isVerified = true;

        user.otp = null;            // Clear OTP after successful verification
        user.otpExpires = null;

        await user.save();

        res.status(200).json({
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


router.post("/resend-otp", otpLimiter, async (req, res) => {
    try {
        const { email } = req.body;

     
        if (!email) {                    // Check email
            return res.status(400).json({
                message: "Email is required"
            });
        }

        
        const user = await User.findOne({ email });    // Find user

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

       
        if (user.isVerified) {          // Check if already verified
            return res.status(400).json({
                message: "User is already verified"
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();         // Generate new OTP
        
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);        // New OTP expires after 10 minutes
        
        user.otp = otp;         // Update user
        user.otpExpires = otpExpires;

        await user.save();

       
        await sendEmail.sendMail({                // Send new OTP
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your New OTP",
            text: `Your new OTP is: ${otp}

This OTP is valid for 10 minutes.

Do not share this OTP with anyone.`
        });

        res.status(200).json({
            message: "New OTP sent successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check email verification
        if (!user.isVerified) {
            return res.status(401).json({
                message: "Please verify your email first"
            });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token: token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});




module.exports = router;