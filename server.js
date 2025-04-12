const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { router } = require('./routes/authRoutes'); // Import auth routes
const connectDB= require("./config/db")
const customerRoutes = require('./routes/customerRoutes');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
connectDB()

// Routes
app.use('/api/auth', router);

app.use('/api/customers', customerRoutes);


const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
