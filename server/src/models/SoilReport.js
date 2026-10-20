import mongoose from 'mongoose';

const soilReportSchema = new mongoose.Schema(
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
    date: { type: Date, required: true, index: true },
    pH: { type: Number, required: true, min: 0, max: 14 },
    nitrogen: { type: Number, required: true, min: 0, max: 10000 },
    phosphorus: { type: Number, required: true, min: 0, max: 10000 },
    potassium: { type: Number, required: true, min: 0, max: 10000 },
    moisture: { type: Number, required: true, min: 0, max: 100 },
    organicCarbon: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true },
);

soilReportSchema.index({ farm: 1, date: -1 });
soilReportSchema.index({ owner: 1, date: -1 });

const SoilReport = mongoose.models.SoilReport || mongoose.model('SoilReport', soilReportSchema);

export default SoilReport;
