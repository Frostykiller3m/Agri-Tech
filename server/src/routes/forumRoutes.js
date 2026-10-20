import { Router } from 'express';

import {
  addComment,
  createPostRoute,
  deletePostRoute,
  editComment,
  getComments,
  getPostById,
  getPosts,
  getReports,
  hidePost,
  likePost,
  removeComment,
  reportContent,
  reviewReport,
  updatePostRoute,
} from '../controllers/forumController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  commentListQuerySchema,
  createCommentSchema,
  createPostSchema,
  forumIdSchema,
  moderationSchema,
  postListQuerySchema,
  reportListQuerySchema,
  reportSchema,
  reportStatusSchema,
  updateCommentSchema,
  updatePostSchema,
} from '../validators/forumValidators.js';

const router = Router();

router.use(protect);
router.get('/posts', validate(postListQuerySchema, 'query'), getPosts);
router.post('/posts', authorize('farmer', 'admin'), validate(createPostSchema), createPostRoute);
router.get('/posts/:id', validate(forumIdSchema, 'params'), getPostById);
router.patch('/posts/:id', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), validate(updatePostSchema), updatePostRoute);
router.delete('/posts/:id', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), deletePostRoute);
router.post('/posts/:id/like', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), likePost);
router.patch('/posts/:id/moderation', authorize('admin'), validate(forumIdSchema, 'params'), validate(moderationSchema), hidePost);
router.get('/posts/:id/comments', validate(forumIdSchema, 'params'), validate(commentListQuerySchema, 'query'), getComments);
router.post('/posts/:id/comments', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), validate(createCommentSchema), addComment);
router.patch('/comments/:id', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), validate(updateCommentSchema), editComment);
router.delete('/comments/:id', authorize('farmer', 'admin'), validate(forumIdSchema, 'params'), removeComment);
router.post('/report', authorize('farmer', 'admin'), validate(reportSchema), reportContent);
router.get('/reports', authorize('admin'), validate(reportListQuerySchema, 'query'), getReports);
router.patch('/reports/:id', authorize('admin'), validate(forumIdSchema, 'params'), validate(reportStatusSchema), reviewReport);

export default router;
