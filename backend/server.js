require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());

const authoresRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

// public routes
app.use('/api/auth', authRoutes);

// protected routes
app.use('/api/authors', authMiddleware, authoresRouter);
app.use('/api/books', authMiddleware, booksRouter);

app.get("/test", (req, res) => {
  res.json({ message: "OK" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});