const mongoose = require('mongoose');
const dotenv = require('dotenv');
const JobOpening = require('../models/JobOpening');
const User = require('../models/User'); // Assuming you have a User model to get a createdBy ID

dotenv.config();

const sampleJobOpenings = [
  {
    title: 'Senior Frontend Developer',
    department: 'Technology',
    description: 'We are looking for an experienced Frontend Developer to join our team.',
    requirements: '5+ years of experience with React, TypeScript, and modern frontend frameworks.',
    status: 'Open',
  },
  {
    title: 'Marketing Manager',
    department: 'Marketing',
    description: 'Lead our marketing team to create and execute innovative campaigns.',
    requirements: 'Proven experience in digital marketing and team management.',
    status: 'Open',
  },
  {
    title: 'HR Generalist',
    department: 'Human Resources',
    description: 'A key role in our HR team, responsible for a wide range of HR functions.',
    requirements: '3+ years of experience in an HR role. Strong knowledge of labor laws.',
    status: 'Closed',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected...');

    // Clear existing job openings
    await JobOpening.deleteMany({});
    console.log('Cleared existing job openings.');

    // Find an admin user to associate with the job openings
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('Could not find an admin user. Please create one first.');
      process.exit(1);
    }

    const jobsWithCreator = sampleJobOpenings.map(job => ({ ...job, createdBy: adminUser._id }));

    await JobOpening.insertMany(jobsWithCreator);
    console.log('Database seeded with sample job openings!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDB();
