// server.js
const express     = require('express');
const path        = require('path');
const mongoose    = require('mongoose');
const dotenv      = require('dotenv');
const cors        = require('cors');
const authRoutes = require('./routes/authRoutes');
const { authenticate } = require('./middleware/authMiddleware');
const customerRoutes = require('./routes/customerRoutes');
const customerPortalRoutes = require('./routes/customerPortalRoutes');
const productRoutes = require('./routes/productRoutes');
const leadRoutes = require('./routes/leadRoutes');
const salesRoutes = require('./routes/sales');
const settingsRoutes = require('./routes/settingsRoutes');
const financeRoutes = require('./routes/finance');
const connectDB   = require('./config/db');
const userManagementRoutes = require('./routes/userManagementRoutes');
const User = require('./models/User');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/sales', authenticate, salesRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/leads', authenticate, leadRoutes);
app.use('/api/finance', authenticate, financeRoutes);
app.use('/api/userManagement', authenticate, userManagementRoutes);
app.use('/api/settings', settingsRoutes);


const PORT = process.env.PORT || 5007;

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
