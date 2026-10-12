const express = require("express");
const app = express();
const { connectDB } = require("./config/db.js")
const cors = require("cors");


app.use(cors({
  origin: "http://localhost:5174",
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));



const dotenv = require("dotenv").config();
const port = process.env.PORT;


app.use(express.json({ limit: "10kb" }));

app.use("/auth", require("./routes/auth.route.js"));
app.use("/employees", require("./routes/employee.route.js"));
app.use("/company", require("./routes/company.route.js"));
app.use("/admin", require("./routes/admin.route.js"));


connectDB();


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});