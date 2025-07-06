const Performance = require('../../models/Performance');
const User = require('../../models/User');

// @desc    Get all performance reviews
// @route   GET /api/hr/performance
// @access  Private (HR)
exports.getPerformanceReviews = async (req, res) => {
  try {
    const reviews = await Performance.find().populate('employee', 'name').populate('reviewer', 'name');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get a single performance review by ID
// @route   GET /api/hr/performance/:id
// @access  Private (HR)
exports.getPerformanceReviewById = async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id).populate('employee', 'name').populate('reviewer', 'name');
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Create a new performance review
// @route   POST /api/hr/performance
// @access  Private (HR)
exports.createPerformanceReview = async (req, res) => {
  const { employee, reviewer, ratings, comments, goals } = req.body;

  try {
    const newReview = new Performance({
      employee,
      reviewer,
      ratings,
      comments,
      goals,
    });

    const review = await newReview.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Update a performance review
// @route   PUT /api/hr/performance/:id
// @access  Private (HR)
exports.updatePerformanceReview = async (req, res) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Delete a performance review
// @route   DELETE /api/hr/performance/:id
// @access  Private (HR)
exports.deletePerformanceReview = async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }

    await review.remove();
    res.status(200).json({ message: 'Performance review removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
