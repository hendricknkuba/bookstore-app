const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const authoresRouter = require('./routes/authors');
const booksRouter = require('./routes/books');

app.use('/api/authors', authoresRouter);
app.use('api/books', booksRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});