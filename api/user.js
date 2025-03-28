const express = require('express');
const app = express();
const User = require('../Schemas/userSchema');
const bcrypt = require('bcryptjs');  
const env = require('dotenv');
const jwt = require('jsonwebtoken');


app.post("/signup", async (req, res) => {
    try {
        const { email, name, password,phone } = req.body;
        const UserExist = await User.findOne({ email });
        if (UserExist) {
            res.status(400).json({ message: "User already exists" });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await new User({ email, name, password: hashedPassword,phone }).save();
            const token = jwt.sign({ email }, process.env.JWT_SECRET);
            return res.status(200).json({
                message: "User created successfully",
                id: newUser._id,
                token,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
               
            });
        }
    } catch (err) {
        console.log("signup:", err);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const isPassword = await bcrypt.compare(password, user.password);  // No change needed here
        if (!isPassword) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }
        const token = jwt.sign({ email }, process.env.JWT_SECRET);
        return res.status(200).json({
            message: "Login successful",
            id: user._id,
            token,
            name: user.name,
            email: user.email,
     
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});

app.put("/:id", async (req, res) => {
    try {
        const { email, name } = req.body;
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        user.email = email;
        user.name = name;
       
        await user.save();
        return res.status(200).json({
            message: "User data updated successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});
app.put("/update/:id", async (req, res) => {
    try {
        const { email, name } = req.body;
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        
        
        if (email) user.email = email;
        if (name) user.name = name;
        
        await user.save();
        return res.status(200).json({
            message: "User data updated successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = app;
