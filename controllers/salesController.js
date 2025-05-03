const SalesOrder = require('../models/SalesOrder');
const Opportunity = require('../models/Opportunity');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const mongoose = require('mongoose'); // mongoose import added

// Get dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Get total revenue and orders
    const salesSummary = await SalesOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get pending orders count
    const pendingOrders = await SalesOrder.countDocuments({
      status: { $in: ['pending', 'processing'] }
    });

    // Get active opportunities
    const opportunityStats = await Opportunity.aggregate([
      {
        $match: {
          stage: { $nin: ['closed-won', 'closed-lost'] }
        }
      },
      {
        $group: {
          _id: null,
          activeOpportunities: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Calculate conversion rate
    const closedOpportunities = await Opportunity.aggregate([
      {
        $match: {
          stage: { $in: ['closed-won', 'closed-lost'] },
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      }
    ]);

    const wonOpps = closedOpportunities.find(o => o._id === 'closed-won')?.count || 0;
    const totalClosedOpps = closedOpportunities.reduce((acc, curr) => acc + curr.count, 0);
    const conversionRate = totalClosedOpps > 0 ? Math.round((wonOpps / totalClosedOpps) * 100) : 0;

    // Get revenue by month
    const revenueByMonth = await SalesOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
              },
              in: { $arrayElemAt: ['$$monthsInString', { $subtract: ['$_id', 1] }] }
            }
          },
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get opportunities by stage
    const opportunitiesByStage = await Opportunity.aggregate([
      {
        $match: {
          stage: { $nin: ['closed-won', 'closed-lost'] }
        }
      },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: '$value' }
        }
      },
      {
        $project: {
          _id: 0,
          stage: '$_id',
          count: 1,
          value: 1
        }
      }
    ]);

    // Get top performing products
    const topProducts = await SalesOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          name: '$product.name',
          revenue: 1,
          quantity: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    const summary = {
      totalRevenue: salesSummary[0]?.totalRevenue || 0,
      totalOrders: salesSummary[0]?.totalOrders || 0,
      averageOrderValue: Math.round(salesSummary[0]?.averageOrderValue || 0),
      pendingOrders,
      activeOpportunities: opportunityStats[0]?.activeOpportunities || 0,
      conversionRate
    };

    res.json({
      summary,
      revenueByMonth,
      opportunitiesByStage,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
};

// Get all sales orders
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await SalesOrder.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SalesOrder.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ error: 'Error fetching sales orders' });
  }
};

// Create a new sales order
exports.createOrder = async (req, res) => {
  try {
    console.log('Creating order with user:', req.user.role);
    
    // Convert IDs to ObjectIds
    const customerObjectId = new mongoose.Types.ObjectId(req.body.customer);
    const createdByObjectId = new mongoose.Types.ObjectId(req.user._id);
    const updatedByObjectId = new mongoose.Types.ObjectId(req.user._id);

    // Build order data
    const orderData = {
      ...req.body,
      customer: customerObjectId,
      createdBy: createdByObjectId,
      updatedBy: updatedByObjectId
    };

    // Create and save the order
    const order = new SalesOrder(orderData);
    await order.save();

    res.status(201).json({ 
      message: 'Order created successfully',
      order 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ 
      message: 'Error creating order',
      error: err.message 
    });
  }
};

// Get a specific sales order
exports.getOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product', 'name price')
      .populate('createdBy', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({ error: 'Error fetching sales order' });
  }
};

// Update a sales order
exports.updateOrder = async (req, res) => {
  try {
    console.log('Updating order:', req.params.id);
    console.log('Update data:', req.body);

    // Convert string IDs to ObjectIds
    const updateData = {
      ...req.body,
      updatedBy: new mongoose.Types.ObjectId(req.user._id),
      customer: new mongoose.Types.ObjectId(req.body.customer),
      items: req.body.items.map(item => ({
        ...item,
        product: new mongoose.Types.ObjectId(item.product)
      }))
    };

    console.log('Transformed update data:', updateData);

    const order = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('customer', 'name email')
     .populate('items.product', 'name price')
     .populate('createdBy', 'name')
     .populate('updatedBy', 'name');

    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ error: 'Sales order not found' });
    }

    console.log('Updated order:', order);
    res.json(order);
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({ 
      error: 'Error updating sales order',
      details: error.message 
    });
  }
};

// Delete a sales order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({ error: 'Error deleting sales order' });
  }
}; 

// Get the last order
exports.getLastOrder = async (req, res) => {
  try {
    const lastOrder = await SalesOrder.findOne()
      .sort({ createdAt: -1 })
      .lean();

    res.json(lastOrder);
  } catch (error) {
    console.error('Error getting last order:', error);
    res.status(500).json({ message: 'Error getting last order' });
  }
};