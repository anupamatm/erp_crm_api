const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { body, validationResult } = require('express-validator');

// Account Controllers
const getAccounts = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    
    // Add search criteria if search term is provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
        { bankName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Account.countDocuments(query);
    
    const accounts = await Account.find(query)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'transactions',
        options: { sort: { date: -1 } } // Sort transactions by date
      })
      .select('-__v');
      
    res.json({
      data: accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAccount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const account = new Account({
      name: req.body.name,
      type: req.body.type,
      code: req.body.code,
      description: req.body.description,
      currency: req.body.currency,
      initialBalance: req.body.initialBalance || 0,
      openingBalance: req.body.openingBalance || 0,
      currentBalance: req.body.currentBalance || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      accountNumber: req.body.accountNumber,
      bankName: req.body.bankName,
      branch: req.body.branch,
      ifscCode: req.body.ifscCode,
      swiftCode: req.body.swiftCode,
      taxId: req.body.taxId,
      notes: req.body.notes,
      email: req.body.email,
      website: req.body.website,
      parentAccount: req.body.parentAccount
    });
    
    const newAccount = await account.save();
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate({
        path: 'transactions',
        options: { sort: { date: -1 } } // Optional: sort transactions by date
      })
      .select('-__v');
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update only the fields that are provided
    const updatableFields = [
      'name', 'type', 'code', 'description', 'currency',
      'initialBalance', 'openingBalance', 'currentBalance',
      'isActive', 'accountNumber', 'bankName', 'branch',
      'ifscCode', 'swiftCode', 'taxId', 'notes', 'email',
      'website', 'parentAccount'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        account[field] = req.body[field];
      }
    });

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const result = await Account.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transaction Controllers
const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('account', 'name type')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .select('-__v');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTransaction = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const transaction = new Transaction({
      date: new Date(req.body.date),
      type: req.body.type,
      account: req.body.account,
      amount: req.body.amount,
      description: req.body.description,
      createdBy: req.user.id
    });

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Summary Controller
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const summary = {
      income: income.length > 0 ? income[0].total : 0,
      expense: expense.length > 0 ? expense[0].total : 0,
      balance: (income.length > 0 ? income[0].total : 0) - (expense.length > 0 ? expense[0].total : 0)
    };

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Account controllers
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
  
  // Transaction controllers
  getTransactions,
  createTransaction,
  
  // Summary controller
  getSummary
};
