import mongoose from 'mongoose';

const weatherDataSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

weatherDataSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 7200 });
weatherDataSchema.index({ farm: 1, fetchedAt: -1 });

const WeatherData = mongoose.models.WeatherData || mongoose.model('WeatherData', weatherDataSchema);

export default WeatherData;
