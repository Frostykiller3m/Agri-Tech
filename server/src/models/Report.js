import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending', required: true, index: true },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;
