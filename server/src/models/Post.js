import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    body: { type: String, required: true, trim: true, minlength: 3, maxlength: 10000 },
    category: {
      type: String,
      enum: ['general', 'crops', 'pests', 'soil', 'weather', 'markets'],
      default: 'general',
      required: true,
      index: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isHidden: { type: Boolean, default: false, required: true, index: true },
  },
  { timestamps: true },
);

postSchema.index({ isHidden: 1, category: 1, createdAt: -1 });
postSchema.index({ title: 'text', body: 'text' });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
