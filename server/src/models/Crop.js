import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['irrigation', 'fertilizer', 'pesticide', 'other'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    quantity: {
      type: Number,
      min: 0,
    },
  },
  { _id: true },
);

const cropSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    variety: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    sowingDate: {
      type: Date,
      required: true,
    },
    expectedHarvestDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['planned', 'growing', 'harvested', 'failed'],
      default: 'planned',
      required: true,
    },
    yieldKg: {
      type: Number,
      min: 0,
    },
    activityLog: {
      type: [activitySchema],
      default: [],
    },
  },
  { timestamps: true },
);

cropSchema.index({ farm: 1, createdAt: -1 });
cropSchema.index({ owner: 1, status: 1 });
cropSchema.index({ farm: 1, status: 1, createdAt: -1 });

const Crop = mongoose.models.Crop || mongoose.model('Crop', cropSchema);

export default Crop;
