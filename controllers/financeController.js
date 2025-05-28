const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { body, validationResult } = require('express-validator');

// Account Controllers
const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate('transactions')
      .select('-__v');
    res.json(accounts);
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
      description: req.body.description
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
      .populate('transactions')
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

    account.name = req.body.name || account.name;
    account.type = req.body.type || account.type;
    account.description = req.body.description || account.description;

    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await account.remove();
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
