import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  jobTitle: {
    type: String,
    trim: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  timezone: {
    type: String,
    default: 'utc',
  },
  notifications: {
    email: {
      surveyResponses: { type: Boolean, default: true },
      surveyReports: { type: Boolean, default: true },
      teamActivity: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
    },
    inApp: {
      surveyResponses: { type: Boolean, default: true },
      teamActivity: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: true },
    },
    push: {
      enabled: { type: Boolean, default: false },
      surveyResponses: { type: Boolean, default: false },
      teamActivity: { type: Boolean, default: false },
    },
    digestFrequency: {
      type: String,
      enum: ['realtime', 'daily', 'weekly', 'never'],
      default: 'daily',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Delete password when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Update timestamps on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema); 