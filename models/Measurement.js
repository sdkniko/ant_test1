const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Anthropometric measurements
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  bodyFatPercentage: {
    type: Number,
    required: true
  },
  // Additional measurements
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    biceps: Number,
    thighs: Number,
    calves: Number
  },
  // Health indicators
  healthIndicators: {
    bloodPressure: String,
    heartRate: Number,
    notes: String
  },
  // Professional comments
  comments: {
    type: String,
    trim: true
  },
  // Alert flags
  alerts: [{
    type: String,
    enum: ['abruptChange', 'outOfRange', 'stagnation', 'missingFollowUp', 'abnormalHealth']
  }]
}, {
  timestamps: true
});

// Index for efficient querying
measurementSchema.index({ athlete: 1, date: -1 });

module.exports = mongoose.model('Measurement', measurementSchema); 