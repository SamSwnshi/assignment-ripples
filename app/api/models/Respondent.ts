import mongoose from 'mongoose';

const respondentSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    trim: true,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
respondentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for email
respondentSchema.index({ email: 1 });

export default mongoose.models.Respondent || mongoose.model('Respondent', respondentSchema); 