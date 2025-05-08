require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Lead = require('./models/Lead');
const Opportunity = require('./models/Opportunity');
const SalesOrder = require('./models/SalesOrder');

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'sales_manager'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    role: 'sales_exec'
  }
];

const sampleProducts = [
  {
    name: 'Product A',
    description: 'High-quality product A',
    price: 99.99,
    category: 'Electronics',
    stock: 100
  },
  {
    name: 'Product B',
    description: 'Premium product B',
    price: 149.99,
    category: 'Electronics',
    stock: 50
  }
];

const sampleCustomers = [
  {
    name: 'Tech Solutions Inc.',
    email: 'contact@techsolutions.com',
    phone: '555-1234',
    address: '123 Tech Street, Silicon Valley',
    company: 'Tech Solutions Inc.',
    status: 'active'
  },
  {
    name: 'Digital Corp',
    email: 'info@digitalcorp.com',
    phone: '555-5678',
    address: '456 Digital Ave, Tech City',
    company: 'Digital Corp',
    status: 'active'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Customer.deleteMany(),
      Product.deleteMany(),
      Lead.deleteMany(),
      Opportunity.deleteMany(),
      SalesOrder.deleteMany()
    ]);
    console.log('Cleared existing data');

    // Create users
const users = await Promise.all(
    sampleUsers.map(user => 
      new User({
        name: user.name,
        email: user.email,
        password: user.password,  // Pass the plain text password
        role: user.role
      }).save()
    )
  );
    console.log('Created users');

    // Create products
    const products = await Promise.all(
      sampleProducts.map(product => 
        new Product(product).save()
      )
    );
    console.log('Created products');

    // Create customer users
    const customerUsers = await Promise.all([
      new User({
        name: 'Tech Solutions Inc.',
        email: 'contact@techsolutions.com',
        password: 'tech123',
        role: 'customer'
      }).save(),
      new User({
        name: 'Digital Corp',
        email: 'info@digitalcorp.com',
        password: 'digital123',
        role: 'customer'
      }).save()
    ]);

    // Create customers
    const customers = await Promise.all([
      new Customer({
        user: customerUsers[0]._id,
        name: 'Tech Solutions Inc.',
        email: 'contact@techsolutions.com',
        phone: '555-1234',
        address: '123 Tech Street, Silicon Valley',
        company: 'Tech Solutions Inc.',
        status: 'active'
      }).save(),
      new Customer({
        user: customerUsers[1]._id,
        name: 'Digital Corp',
        email: 'info@digitalcorp.com',
        phone: '555-5678',
        address: '456 Digital Ave, Tech City',
        company: 'Digital Corp',
        status: 'active'
      }).save()
    ]);
    console.log('Created customers');

    // Create leads
    const leads = await Promise.all([
      new Lead({
        user: users[0]._id,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@example.com',
        phone: '555-9876',
        company: 'Tech Innovations',
        source: 'website',
        status: 'new',
        priority: 'medium',
        assignedTo: users[1]._id
      }).save(),
      new Lead({
        user: users[0]._id,
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@example.com',
        phone: '555-4321',
        company: 'Digital Solutions',
        source: 'referral',
        status: 'contacted',
        priority: 'high',
        assignedTo: users[2]._id
      }).save()
    ]);
    console.log('Created leads');

    // Create opportunities
    const opportunities = await Promise.all([
      new Opportunity({
        customer: customers[0]._id,
        title: 'New Enterprise Deal',
        stage: 'qualification',
        value: 10000,
        probability: 70,
        expectedCloseDate: new Date('2025-06-30'),
        source: 'website',
        products: [
          { product: products[0]._id, quantity: 10, unitPrice: products[0].price }
        ],
        assignedTo: users[1]._id,
        createdBy: users[0]._id
      }).save(),
      new Opportunity({
        customer: customers[1]._id,
        title: 'Digital Transformation Project',
        stage: 'proposal',
        value: 15000,
        probability: 85,
        expectedCloseDate: new Date('2025-07-15'),
        source: 'referral',
        products: [
          { product: products[1]._id, quantity: 5, unitPrice: products[1].price }
        ],
        assignedTo: users[2]._id,
        createdBy: users[0]._id
      }).save()
    ]);
    console.log('Created opportunities');
    // Create sales orders
const salesOrders = await Promise.all([
    new SalesOrder({
      customer: customers[0]._id,
      orderNumber: 'ORD-0001',
      items: [
        { product: products[0]._id, quantity: 2, unitPrice: products[0].price, total: products[0].price * 2 }
      ],
      billingAddress: {
        street: '123 Tech Street',
        city: 'Silicon Valley',
        state: 'CA',
        postalCode: '94025',
        country: 'USA'
      },
      shippingAddress: {
        street: '123 Tech Street',
        city: 'Silicon Valley',
        state: 'CA',
        postalCode: '94025',
        country: 'USA'
      },
      terms: 'Net 30',
      deliveryDate: new Date('2025-06-15'),
      total: products[0].price * 2,
      status: 'pending',
      assignedTo: users[1]._id,
      createdBy: users[0]._id
    }).save(),
    new SalesOrder({
      customer: customers[1]._id,
      orderNumber: 'ORD-0002',
      items: [
        { product: products[1]._id, quantity: 3, unitPrice: products[1].price, total: products[1].price * 3 }
      ],
      billingAddress: {
        street: '456 Digital Ave',
        city: 'Tech City',
        state: 'CA',
        postalCode: '94026',
        country: 'USA'
      },
      shippingAddress: {
        street: '456 Digital Ave',
        city: 'Tech City',
        state: 'CA',
        postalCode: '94026',
        country: 'USA'
      },
      terms: 'Net 30',
      deliveryDate: new Date('2025-06-20'),
      total: products[1].price * 3,
      status: 'processing',
      assignedTo: users[2]._id,
      createdBy: users[0]._id
    }).save()
  ]);
  console.log('Created sales orders');
  
  console.log('Database seeding completed successfully');
  process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  };
};

seedDatabase();   
