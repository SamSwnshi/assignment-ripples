import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['short-text', 'long-text', 'single-choice', 'multiple-choice', 'rating', 'nps'],
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    default: [],
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const templateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Pre-Purchase', 'Post-Purchase'],
  },
  questions: {
    type: [questionSchema],
    required: true,
  },
  features: {
    type: [String],
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
templateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
templateSchema.index({ id: 1 }, { unique: true });
templateSchema.index({ createdBy: 1 });
templateSchema.index({ type: 1 });
templateSchema.index({ usageCount: -1 });

const Template = mongoose.models.Template || mongoose.model('Template', templateSchema);

export default Template; 