const JobOpening = require('../models/JobOpening');
const asyncHandler = require('express-async-handler');

// @desc    Get all job openings
// @route   GET /api/hr/recruitment/openings
// @access  Private/HR
const getJobOpenings = asyncHandler(async (req, res) => {
  const jobOpenings = await JobOpening.find().populate('createdBy', 'name');
  res.json(jobOpenings);
});

// @desc    Get a single job opening by ID
// @route   GET /api/hr/recruitment/openings/:id
// @access  Private/HR
const getJobOpeningById = asyncHandler(async (req, res) => {
  const jobOpening = await JobOpening.findById(req.params.id);

  if (jobOpening) {
    res.json(jobOpening);
  } else {
    res.status(404);
    throw new Error('Job opening not found');
  }
});

// @desc    Create a new job opening
// @route   POST /api/hr/recruitment/openings
// @access  Private/HR
const createJobOpening = asyncHandler(async (req, res) => {
  const { title, department, description, requirements, closingDate } = req.body;

  const jobOpening = new JobOpening({
    title,
    department,
    description,
    requirements,
    closingDate,
    createdBy: req.user._id,
  });

  const createdJobOpening = await jobOpening.save();
  res.status(201).json(createdJobOpening);
});

// @desc    Update a job opening
// @route   PUT /api/hr/recruitment/openings/:id
// @access  Private/HR
const updateJobOpening = asyncHandler(async (req, res) => {
  const { title, department, description, requirements, status, closingDate } = req.body;

  const jobOpening = await JobOpening.findById(req.params.id);

  if (jobOpening) {
    jobOpening.title = title || jobOpening.title;
    jobOpening.department = department || jobOpening.department;
    jobOpening.description = description || jobOpening.description;
    jobOpening.requirements = requirements || jobOpening.requirements;
    jobOpening.status = status || jobOpening.status;
    jobOpening.closingDate = closingDate || jobOpening.closingDate;

    const updatedJobOpening = await jobOpening.save();
    res.json(updatedJobOpening);
  } else {
    res.status(404);
    throw new Error('Job opening not found');
  }
});

// @desc    Delete a job opening
// @route   DELETE /api/hr/recruitment/openings/:id
// @access  Private/HR
const deleteJobOpening = asyncHandler(async (req, res) => {
  const jobOpening = await JobOpening.findById(req.params.id);

  if (jobOpening) {
    await jobOpening.remove();
    res.json({ message: 'Job opening removed' });
  } else {
    res.status(404);
    throw new Error('Job opening not found');
  }
});

module.exports = {
  getJobOpenings,
  getJobOpeningById,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
};
