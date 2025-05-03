// server.js
const express     = require('express');
const mongoose    = require('mongoose');
const dotenv      = require('dotenv');
const cors        = require('cors');
const authRoutes = require('./routes/authRoutes');
const { authenticate } = require('./middleware/authMiddleware');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const leadRoutes = require('./routes/leadRoutes');
const salesRoutes = require('./routes/sales');
const connectDB   = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/sales', authenticate, salesRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/leads', authenticate, leadRoutes);

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
