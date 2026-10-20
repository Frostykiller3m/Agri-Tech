import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 3000 },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
