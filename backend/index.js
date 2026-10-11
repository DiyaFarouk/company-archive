const express = require("express");
const app = express();
const { connectDB } = require("./config/db.js")
const cors = require("cors");


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const dotenv = require("dotenv").config();
const port = process.env.PORT;




connectDB();


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});