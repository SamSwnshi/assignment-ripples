import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  respondentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Respondent',
    required: true,
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
});

// Create compound index for survey and respondent
responseSchema.index({ surveyId: 1, respondentId: 1 });

export default mongoose.models.Response || mongoose.model('Response', responseSchema); 