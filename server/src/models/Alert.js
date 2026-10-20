import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['pest', 'weather', 'general'], required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
    },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 140 },
    message: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
    region: {
      state: { type: String, trim: true, maxlength: 100 },
      district: { type: String, trim: true, maxlength: 100 },
    },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', default: null },
    cropFilter: [{ type: String, trim: true, lowercase: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null },
    dedupeKey: { type: String, default: undefined },
    ruleKey: { type: String, default: undefined },
  },
  { timestamps: true },
);

alertSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
alertSchema.index({ 'region.state': 1, 'region.district': 1, expiresAt: 1, createdAt: -1 });
alertSchema.index({ farm: 1, expiresAt: 1, createdAt: -1 });
alertSchema.index({ createdAt: -1 });

const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

export default Alert;
