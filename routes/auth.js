const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

router.post("/signup", async (req, res) => {
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

module.exports = router;