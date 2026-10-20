import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const consultationSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', default: null },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', default: null },
    topic: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, required: true, trim: true, minlength: 5, maxlength: 10000 },
    imageUrls: { type: [String], default: [], validate: (images) => images.length <= 3 },
    status: {
      type: String,
      enum: ['open', 'answered', 'closed'],
      default: 'open',
      required: true,
      index: true,
    },
    responses: { type: [responseSchema], default: [] },
  },
  { timestamps: true },
);

consultationSchema.index({ farmer: 1, createdAt: -1 });
consultationSchema.index({ farmer: 1, updatedAt: -1 });
consultationSchema.index({ status: 1, createdAt: -1 });
consultationSchema.index({ status: 1, updatedAt: -1 });

const Consultation =
  mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);

export default Consultation;
