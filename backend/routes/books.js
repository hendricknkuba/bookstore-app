const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET /api/books
router.get("/", (req, res) => {
  try {
    const query = 
    `
      SELECT books.book_id, books.title, books.author_id, authors.name AS author_name
      FROM books
      JOIN authors ON books.author_id = authors.author_id
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error retrieving books",
          details: err.message,
        });
      }

      return res.status(200).json({ success: true, data: rows });
    });
  } 
  catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error occurred",
      details: error.message,
    });
  }
});

// POST /api/books
router.post("/", (req, res) => {
  try {
    const { title, author_id } = req.body;

    if (!title || title.trim() === "") {
      throw new Error("Book title is required");
    }

    if (!author_id || isNaN(author_id) || author_id <= 0) {
      throw new Error("Valid author_id is required");
    }

    const query = "INSERT INTO books (title, author_id) VALUES (?, ?)";

    db.run(query, [title.trim(), author_id], function (err) {
      if (err) {
        const fkError = err.message.includes("FOREIGN KEY");
        return res.status(400).json({
          success: false,
          message: fkError
            ? "Invalid author_id: Author does not exist"
            : "Error adding book",
          details: err.message,
        });
      }

      return res.json({
        success: true,
        message: "Book added successfully",
        data: {
          book_id: this.lastID,
          title,
          author_id,
        },
      });
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      details: error.message,
    });
  }
});

// PUT /api/books/:id
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title, author_id } = req.body;

    if (!title || title.trim() === "") {
      throw new Error("Book title is required");
    }

    if (!author_id || isNaN(author_id) || author_id <= 0) {
      throw new Error("Valid author_id is required");
    }
    
    const query = "UPDATE books SET title = ?, author_id = ? WHERE book_id = ?";

    db.run(query, [title.trim(), author_id, id], function (err) {
      if (err) {
        const fkError = err.message.includes("FOREIGN KEY");
        return res.status(400).json({
          success: false,
          message: fkError
            ? "Invalid author_id: Author does not exist"
            : "Error updating book",
          details: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        });
      }
      
      return res.json({
        success: true,
        message: "Book updated successfully",
        data: {
          book_id: id,
          title,
          author_id,
        },
      });
    } );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      details: error.message,
    });
  }
});

// DELETE /api/books/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM books WHERE book_id = ?";

    db.run(query, [id], function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error deleting book",
          details: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Book not found",
        });
      }

      return res.json({
        success: true,
        message: "Book deleted successfully",
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

module.exports = router;
