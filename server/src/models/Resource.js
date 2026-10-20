import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
    category: { type: String, enum: ['seed', 'fertilizer', 'pesticide', 'equipment'], required: true, index: true },
    description: { type: String, required: true, trim: true, minlength: 5, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    imageUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

resourceSchema.index({ status: 1, category: 1, createdAt: -1 });
resourceSchema.index({ name: 'text', description: 'text' });

const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

export default Resource;
