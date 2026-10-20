import mongoose from 'mongoose';

import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import { sanitizePlainText } from '../utils/sanitizeText.js';

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureId(id, message) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, message);
}

function visiblePostFilter(user) {
  return user.role === 'admin' ? {} : { isHidden: false };
}

function publicPost(post, user) {
  const result = {
    ...post,
    likeCount: post.likes.length,
    likedByMe: post.likes.some((id) => String(id) === String(user._id)),
  };
  delete result.likes;
  return result;
}

async function getAccessiblePost(user, id) {
  ensureId(id, 'Post not found');
  const post = await Post.findOne({ _id: id, ...visiblePostFilter(user) }).lean();
  if (!post) throw httpError(404, 'Post not found');
  return post;
}

function canManageContent(user, authorId) {
  return user.role === 'admin' || String(user._id) === String(authorId);
}

function sanitizeRequiredText(value, minimum, label) {
  const safeValue = sanitizePlainText(value);
  if (safeValue.length < minimum) throw httpError(400, `${label} is too short after sanitization`);
  return safeValue;
}

export async function listPosts(user, { category, page, limit }) {
  const filter = { ...visiblePostFilter(user), ...(category ? { category } : {}) };
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('author title body category likes isHidden createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name role')
      .lean(),
    Post.countDocuments(filter),
  ]);
  return {
    posts: posts.map((post) => publicPost(post, user)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createPost(user, data) {
  const post = await Post.create({
    author: user._id,
    title: sanitizeRequiredText(data.title, 3, 'Post title'),
    body: sanitizeRequiredText(data.body, 3, 'Post body'),
    category: data.category,
  });
  const result = await Post.findById(post._id).populate('author', 'name role').lean();
  return publicPost(result, user);
}

export async function getPost(user, id) {
  const post = await getAccessiblePost(user, id);
  const result = await Post.populate(post, { path: 'author', select: 'name role' });
  return publicPost(result, user);
}

export async function updatePost(user, id, data) {
  ensureId(id, 'Post not found');
  const existing = await Post.findById(id).select('author isHidden').lean();
  if (!existing) throw httpError(404, 'Post not found');
  if (user.role !== 'admin' && existing.isHidden) throw httpError(404, 'Post not found');
  if (String(existing.author) !== String(user._id))
    throw httpError(403, 'Only the post author can edit this post');
  const sanitized = Object.fromEntries(
    Object.entries(data).map(([key, value]) =>
      key === 'category' ? [key, value] : [key, sanitizeRequiredText(value, 3, `Post ${key}`)],
    ),
  );
  const post = await Post.findByIdAndUpdate(
    id,
    { $set: sanitized },
    { new: true, runValidators: true },
  )
    .populate('author', 'name role')
    .lean();
  return publicPost(post, user);
}

export async function deletePost(user, id) {
  ensureId(id, 'Post not found');
  const post = await Post.findById(id).select('author isHidden').lean();
  if (!post) throw httpError(404, 'Post not found');
  if (user.role !== 'admin' && post.isHidden) throw httpError(404, 'Post not found');
  if (!canManageContent(user, post.author)) throw httpError(403, 'You cannot delete this post');
  await Promise.all([Post.deleteOne({ _id: id }), Comment.deleteMany({ post: id })]);
}

export async function togglePostLike(user, id) {
  const post = await getAccessiblePost(user, id);
  const userId = new mongoose.Types.ObjectId(String(user._id));
  const liked = post.likes.some((likeId) => String(likeId) === String(userId));
  const updated = await Post.findOneAndUpdate(
    { _id: id, ...visiblePostFilter(user) },
    [
      {
        $set: {
          likes: liked
            ? { $filter: { input: '$likes', as: 'likeId', cond: { $ne: ['$$likeId', userId] } } }
            : { $concatArrays: ['$likes', [userId]] },
        },
      },
    ],
    { new: true },
  )
    .populate('author', 'name role')
    .lean();
  if (!updated) throw httpError(404, 'Post not found');
  return publicPost(updated, user);
}

export async function listComments(user, postId, { page, limit }) {
  await getAccessiblePost(user, postId);
  const filter = { post: postId };
  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .select('post author body createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name role')
      .lean(),
    Comment.countDocuments(filter),
  ]);
  return { comments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createComment(user, postId, body) {
  await getAccessiblePost(user, postId);
  const comment = await Comment.create({
    post: postId,
    author: user._id,
    body: sanitizeRequiredText(body, 1, 'Comment'),
  });
  return Comment.findById(comment._id).populate('author', 'name role').lean();
}

export async function updateComment(user, id, body) {
  ensureId(id, 'Comment not found');
  const comment = await Comment.findById(id).select('author post').lean();
  if (!comment) throw httpError(404, 'Comment not found');
  await getAccessiblePost(user, comment.post);
  if (String(comment.author) !== String(user._id))
    throw httpError(403, 'Only the comment author can edit this comment');
  return Comment.findByIdAndUpdate(
    id,
    { $set: { body: sanitizeRequiredText(body, 1, 'Comment') } },
    { new: true, runValidators: true },
  )
    .populate('author', 'name role')
    .lean();
}

export async function deleteComment(user, id) {
  ensureId(id, 'Comment not found');
  const comment = await Comment.findById(id).select('author post').lean();
  if (!comment) throw httpError(404, 'Comment not found');
  await getAccessiblePost(user, comment.post);
  if (!canManageContent(user, comment.author))
    throw httpError(403, 'You cannot delete this comment');
  await Comment.deleteOne({ _id: id });
}

export async function createReport(user, { targetType, targetId, reason }) {
  ensureId(targetId, 'Reported content not found');
  if (targetType === 'post') await getAccessiblePost(user, targetId);
  else {
    const comment = await Comment.findById(targetId).select('post').lean();
    if (!comment) throw httpError(404, 'Reported content not found');
    await getAccessiblePost(user, comment.post);
  }
  return Report.create({
    targetType,
    targetId,
    reporter: user._id,
    reason: sanitizeRequiredText(reason, 3, 'Report reason'),
  });
}

export async function moderatePost(admin, id, isHidden) {
  if (admin.role !== 'admin') throw httpError(403, 'Only admins can moderate posts');
  ensureId(id, 'Post not found');
  const post = await Post.findByIdAndUpdate(id, { $set: { isHidden } }, { new: true })
    .populate('author', 'name role')
    .lean();
  if (!post) throw httpError(404, 'Post not found');
  return publicPost(post, admin);
}

export async function listReports(admin, { status, page, limit }) {
  if (admin.role !== 'admin') throw httpError(403, 'Only admins can review reports');
  const filter = status ? { status } : {};
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .select('targetType targetId reporter reason status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporter', 'name role')
      .lean(),
    Report.countDocuments(filter),
  ]);
  const commentIds = reports
    .filter((report) => report.targetType === 'comment')
    .map((report) => report.targetId);
  const comments = commentIds.length
    ? await Comment.find({ _id: { $in: commentIds } })
        .select('_id post')
        .lean()
    : [];
  const postByComment = new Map(comments.map((comment) => [String(comment._id), comment.post]));
  const reportsWithPost = reports.map((report) => ({
    ...report,
    targetPostId:
      report.targetType === 'post'
        ? report.targetId
        : postByComment.get(String(report.targetId)) || null,
  }));
  return {
    reports: reportsWithPost,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateReportStatus(admin, id, status) {
  if (admin.role !== 'admin') throw httpError(403, 'Only admins can review reports');
  ensureId(id, 'Report not found');
  const report = await Report.findByIdAndUpdate(id, { $set: { status } }, { new: true })
    .populate('reporter', 'name role')
    .lean();
  if (!report) throw httpError(404, 'Report not found');
  return report;
}
