require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();

connectDB();

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.send("Authentication & User Profile API");
});

app.get("/about", (req, res) => {
    res.send("This is Authentication API");
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});