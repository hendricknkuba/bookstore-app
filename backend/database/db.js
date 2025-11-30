const path = require("path");
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, "bookstore.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

db.serialize(() => {
    db.run(
    `
        CREATE TABLE IF NOT EXISTS authors (
            author_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `
    );

    db.run(
    `
        CREATE TABLE IF NOT EXISTS books (
            book_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            FOREIGN KEY (author_id) REFERENCES authors(author_id)
        )
    `
    );

    db.run(
    `
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    `
    );
});

module.exports = db;