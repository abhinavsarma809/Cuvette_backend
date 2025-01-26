const mongoose = require("mongoose");
const express = require("express");
const app = express();
const env = require("dotenv");
const userRoutes = require("./api/user");
const linkRoutes = require("./api/link");
const cors = require('cors');

env.config(); 
app.use(
    cors({
        origin:"http://localhost:5173"
    })


)

app.use(express.json());
const MONGO_URL = process.env.MONGO_URL;
const Port = process.env.Port||3000;

app.get("/",(req,res)=>{
    res.send("Hello world");



});


mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, 
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); 
  });

app.use("/api/user", userRoutes);
app.use("/api/link", linkRoutes); 
app.use("/", linkRoutes); 
app.listen(Port,()=>{
    console.log(`Server is running on port ${Port}`);
})

