const express = require("express");
const router = express.Router();
const db = require("../database/db");

// GET /api/books
router.get("/", (req, res) => {
  // lógica depois
});

// POST /api/books
router.post("/", (req, res) => {
  // lógica depois
});

// PUT /api/books/:id
router.put("/:id", (req, res) => {
  // lógica depois
});

// DELETE /api/books/:id
router.delete("/:id", (req, res) => {
  // lógica depois
});

module.exports = router;
