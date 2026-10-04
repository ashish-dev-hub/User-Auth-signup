const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    mobile: {
        type: String,
        default: ""
    },

   isVerified: {
    type: Boolean,
    default: false
    },

otp: {
    type: String,
    default: null
},

otpExpires: {
    type: Date,
    default: null
},

profileImage: {
    secure_url: {
        type: String,
        default: ""
    },
    public_id: {
        type: String,
        default: ""
    }
}
});

module.exports = mongoose.model("User", userSchema);