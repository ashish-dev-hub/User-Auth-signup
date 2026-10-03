const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 

    limit: 3, 

    message: {
        message: "Too many OTP requests. Please try again after 10 minutes."
    },

    standardHeaders: true,
    legacyHeaders: false
});

module.exports = otpLimiter;