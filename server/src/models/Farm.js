import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coordinates) => coordinates.length === 2
            && coordinates[0] >= -180 && coordinates[0] <= 180
            && coordinates[1] >= -90 && coordinates[1] <= 90,
          message: 'Location coordinates must be [longitude, latitude]',
        },
      },
    },
    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    areaInAcres: {
      type: Number,
      required: true,
      min: 0.01,
    },
    soilType: {
      type: String,
      enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'other'],
      required: true,
    },
    irrigationType: {
      type: String,
      enum: ['rainfed', 'drip', 'sprinkler', 'canal', 'well', 'other'],
      required: true,
    },
  },
  { timestamps: true },
);

farmSchema.index({ location: '2dsphere' });
farmSchema.index({ owner: 1, createdAt: -1 });

const Farm = mongoose.models.Farm || mongoose.model('Farm', farmSchema);

export default Farm;
