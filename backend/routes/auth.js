const express = require('express');
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET  = process.env.JWT_SECRET;

router.post("/register", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const query = "INSERT INTO users (email, password_hash) VALUES (?, ?)";
        db.run(query, [email, passwordHash], function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error registering user",
                    details: err.message,
                });
            }

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                userId: this.lastID,
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unexpected error occurred",
            details: error.message,
        });
    }
});

router.post("/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const query = "SELECT * FROM users WHERE email = ?";
        db.get(query, [email], (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error during login",
                    details: err.message,
                });
            }

            if (!user || !bcrypt.compareSync(password, user.password_hash)) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, {
                expiresIn: "1h",
            });

            return res.json({
                success: true,
                message: "Login successful",
                token,
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unexpected error occurred",
            details: error.message,
        });
    }
});

router.post("/logout", (req, res) => {
  return res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = router;