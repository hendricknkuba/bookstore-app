const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./bookstore.db");

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
    )
});

module.exports = db;