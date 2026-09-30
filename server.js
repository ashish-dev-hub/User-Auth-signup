const express = require("express");
const app = express();


app.get("/", (req, res) => {
    res.send("Authentication & User Profile API");
});

app.get("/about", (req, res) => {
    res.send("This is Authentication API");
});






const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

