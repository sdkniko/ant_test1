require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anthropometric', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB();

// Models
const User = require('./models/User');
const AnthropometricMeasurement = require('./models/AnthropometricMeasurement');
const PerformanceMeasurement = require('./models/PerformanceMeasurement');
const HealthMeasurement = require('./models/HealthMeasurement');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, gender, age, country } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      name,
      role,
      gender,
      age,
      country
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        age: user.age,
        country: user.country
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        age: user.age,
        country: user.country
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected Routes
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Anthropometric Measurements Routes
app.get('/api/anthropometric', auth, async (req, res) => {
  try {
    const measurements = await AnthropometricMeasurement.find({ userId: req.user.id })
      .populate('athleteId', 'name');
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/anthropometric', auth, async (req, res) => {
  try {
    const measurement = new AnthropometricMeasurement({
      ...req.body,
      userId: req.user.id,
      athleteId: req.body.athleteId
    });
    const newMeasurement = await measurement.save();
    const populatedMeasurement = await AnthropometricMeasurement.findById(newMeasurement._id)
      .populate('athleteId', 'name');
    res.status(201).json(populatedMeasurement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/anthropometric/:id', auth, async (req, res) => {
  try {
    const measurement = await AnthropometricMeasurement.findById(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    if (measurement.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this measurement' });
    }

    const updatedMeasurement = await AnthropometricMeasurement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('athleteId', 'name');

    res.json(updatedMeasurement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/anthropometric/:id', auth, async (req, res) => {
  try {
    const measurement = await AnthropometricMeasurement.findById(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ message: 'Measurement not found' });
    }

    if (measurement.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this measurement' });
    }

    await AnthropometricMeasurement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Measurement deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Performance Measurements Routes
app.get('/api/performance', auth, async (req, res) => {
  try {
    const measurements = await PerformanceMeasurement.find({ userId: req.user.id });
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/performance', auth, async (req, res) => {
  try {
    const measurement = new PerformanceMeasurement({
      ...req.body,
      userId: req.user.id
    });
    const newMeasurement = await measurement.save();
    res.status(201).json(newMeasurement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Health Measurements Routes
app.get('/api/health', auth, async (req, res) => {
  try {
    const measurements = await HealthMeasurement.find({ userId: req.user.id });
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/health', auth, async (req, res) => {
  try {
    const measurement = new HealthMeasurement({
      ...req.body,
      userId: req.user.id
    });
    const newMeasurement = await measurement.save();
    res.status(201).json(newMeasurement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Measurements Routes (for backward compatibility)
app.get('/api/measurements', auth, async (req, res) => {
  try {
    const anthropometric = await AnthropometricMeasurement.find({ userId: req.user.id });
    const performance = await PerformanceMeasurement.find({ userId: req.user.id });
    const health = await HealthMeasurement.find({ userId: req.user.id });
    
    res.json({
      anthropometric,
      performance,
      health
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Athletes Routes
app.get('/api/athletes', auth, async (req, res) => {
  try {
    // For professionals, get all athletes
    // For athletes, only get their own data
    const query = req.user.role === 'professional' 
      ? { role: 'athlete' } 
      : { _id: req.user.id, role: 'athlete' };
    const athletes = await User.find(query).select('-password');
    res.json(athletes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/athletes', auth, async (req, res) => {
  try {
    // Only professionals can create athletes
    if (req.user.role !== 'professional') {
      return res.status(403).json({ message: 'Only professionals can create athletes' });
    }

    const { email, password, name, gender, age, country, sport, phone } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new athlete
    user = new User({
      email,
      password,
      name,
      role: 'athlete',
      gender,
      age,
      country,
      sport,
      phone
    });

    await user.save();

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      age: user.age,
      country: user.country,
      sport: user.sport,
      phone: user.phone
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/athletes/:id', auth, async (req, res) => {
  try {
    // Only professionals can update athletes
    if (req.user.role !== 'professional') {
      return res.status(403).json({ message: 'Only professionals can update athletes' });
    }

    const { name, gender, age, country, sport, phone } = req.body;
    const athlete = await User.findById(req.params.id);
    
    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    if (athlete.role !== 'athlete') {
      return res.status(400).json({ message: 'User is not an athlete' });
    }

    athlete.name = name || athlete.name;
    athlete.gender = gender || athlete.gender;
    athlete.age = age || athlete.age;
    athlete.country = country || athlete.country;
    athlete.sport = sport || athlete.sport;
    athlete.phone = phone || athlete.phone;

    await athlete.save();

    res.json({
      id: athlete._id,
      name: athlete.name,
      email: athlete.email,
      role: athlete.role,
      gender: athlete.gender,
      age: athlete.age,
      country: athlete.country,
      sport: athlete.sport,
      phone: athlete.phone
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/athletes/:id', auth, async (req, res) => {
  try {
    // Only professionals can delete athletes
    if (req.user.role !== 'professional') {
      return res.status(403).json({ message: 'Only professionals can delete athletes' });
    }

    const athlete = await User.findById(req.params.id);
    
    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    if (athlete.role !== 'athlete') {
      return res.status(400).json({ message: 'User is not an athlete' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Athlete deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 