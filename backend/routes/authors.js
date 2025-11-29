const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/authors
router.get("/", (req, res) => {
  try {
    db.all("SELECT * FROM authors", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Error retrieving authors",
                details: err.message,
            });
        }

        return res.status(200).json({ success: true, data: rows });
    });

  } catch (error) {
    return res.status(500).json({ 
        success: false,
        message: "Unexpected error occurred",
        details: error.message,
    });
  }
});

// POST /api/authors
router.post("/", (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new Error("Author name is required");
    }

    const query = "INSERT INTO authors (name) VALUES (?)";
    db.run(query, [name.trim()], function (err) {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Error adding author",
                details: err.message,
            });
        }

        return res.status(201).json({ 
            success: true,
            message: "Author added successfully",
            data: {
                author_id: this.lastID,
                name,
            },
        });
    });
  } catch (error) {
    return res.status(400).json({
        success: false,
        message: "Invalid request data",
        details: error.message,
    })
  }
});

module.exports = router;