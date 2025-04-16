require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add this
const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/db');

// Connect to Database
connectDB();

// Initialize app
const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser()); // Add cookie parser

// Routes
app.use('/api', require('./routes'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));