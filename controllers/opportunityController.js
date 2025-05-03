const Opportunity = require('../models/Opportunity');
const SalesOrder = require('../models/SalesOrder'); // Assuming you have a SalesOrder model

// Get all opportunities
exports.getAllOpportunities = async (req, res) => {
  try {
    const { page = 1, limit = 10, stage, search } = req.query;
    const query = {};

    if (stage) {
      query.stage = stage;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const opportunities = await Opportunity.find(query)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('products.product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Opportunity.countDocuments(query);

    res.json({
      opportunities,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Error fetching opportunities' });
  }
};

// Create a new opportunity
exports.createOpportunity = async (req, res) => {
  try {
    const opportunity = new Opportunity({
      ...req.body,
      createdBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id
    });
    await opportunity.save();
    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Error creating opportunity' });
  }
};

// Get a specific opportunity
exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .populate('products.product', 'name price')
      .populate('createdBy', 'name')
      .populate('activities.performedBy', 'name');

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ error: 'Error fetching opportunity' });
  }
};

// Update an opportunity
exports.updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('customer', 'name email')
     .populate('assignedTo', 'name email')
     .populate('products.product', 'name price');

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Error updating opportunity' });
  }
};

// Delete an opportunity
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findByIdAndDelete(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Error deleting opportunity' });
  }
};

// Add activity to opportunity
exports.addActivity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    opportunity.activities.push({
      ...req.body,
      performedBy: req.user._id,
      date: new Date()
    });

    await opportunity.save();
    
    const updatedOpportunity = await Opportunity.findById(req.params.id)
      .populate('activities.performedBy', 'name');

    res.json(updatedOpportunity.activities[updatedOpportunity.activities.length - 1]);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ error: 'Error adding activity' });
  }
};

// Convert opportunity to order
exports.convertToOrder = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const { items, billingAddress, shippingAddress, terms, deliveryDate } = req.body;

    // Get the opportunity
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Check if opportunity is already converted
    if (opportunity.convertedToOrderId) {
      return res.status(400).json({ error: 'Opportunity has already been converted to an order' });
    }

    // Check if opportunity is in closed-won stage
    if (opportunity.stage !== 'closed-won') {
      return res.status(400).json({ error: 'Opportunity must be in closed-won stage to convert to order' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Create a new order
    const order = new SalesOrder({
      customer: opportunity.customer,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      billingAddress,
      shippingAddress,
      terms,
      deliveryDate,
      total,
      status: 'pending',
      assignedTo: opportunity.assignedTo,
      createdBy: opportunity.createdBy,
      createdDate: new Date()
    });

    // Save the order
    await order.save();

    // Update the opportunity
    opportunity.stage = 'closed-won';
    opportunity.closedDate = new Date();
    opportunity.convertedToOrderId = order._id;
    await opportunity.save();

    res.json({
      message: 'Opportunity converted to order successfully',
      order
    });
  } catch (error) {
    console.error('Error converting opportunity to order:', error);
    if (error.code === 11000) {
      // If order number generation fails, try again with a different approach
      try {
        // First, remove any existing order with null orderNumber
        await SalesOrder.deleteOne({ orderNumber: null });
        
        // Create a new order with a temporary order number
        const order = new SalesOrder({
          customer: opportunity.customer,
          items: items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          })),
          billingAddress,
          shippingAddress,
          terms,
          deliveryDate,
          total,
          status: 'pending',
          assignedTo: opportunity.assignedTo,
          createdBy: opportunity.createdBy,
          createdDate: new Date(),
          orderNumber: `TEMP-${Date.now()}` // Use a temporary order number
        });
        
        await order.save();
        
        // Update the opportunity
        opportunity.stage = 'closed-won';
        opportunity.closedDate = new Date();
        opportunity.convertedToOrderId = order._id;
        await opportunity.save();

        res.json({
          message: 'Opportunity converted to order successfully (temporary order number assigned)',
          order
        });
      } catch (saveError) {
        console.error('Error saving order with temporary number:', saveError);
        res.status(500).json({ error: 'Error converting opportunity to order' });
      }
    } else {
      res.status(500).json({ error: 'Error converting opportunity to order' });
    }
  }
};

// Get opportunity statistics
exports.getStatistics = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      },
      {
        $project: {
          _id: 0,
          stage: '$_id',
          count: 1,
          totalValue: 1
        }
      }
    ];

    const statistics = await Opportunity.aggregate(pipeline);
    
    // Define all possible stages
    const allStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    
    // Create a complete statistics object with all stages
    const completeStats = allStages.map(stage => {
      const stat = statistics.find(s => s.stage === stage);
      return {
        stage,
        count: stat ? stat.count : 0,
        totalValue: stat ? stat.totalValue : 0
      };
    });

    const totalStats = completeStats.reduce((acc, curr) => {
      return {
        totalCount: (acc.totalCount || 0) + curr.count,
        totalValue: (acc.totalValue || 0) + curr.totalValue
      };
    }, {});

    res.json({
      byStage: completeStats,
      total: totalStats
    });
  } catch (error) {
    console.error('Error fetching opportunity statistics:', error);
    res.status(500).json({ error: 'Error fetching opportunity statistics' });
  }
}; 