import Joi from 'joi';

const objectId = Joi.string().hex().length(24);
const categories = ['general', 'crops', 'pests', 'soil', 'weather', 'markets'];

export const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180).required(),
  body: Joi.string().trim().min(3).max(10000).required(),
  category: Joi.string().valid(...categories).default('general'),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180),
  body: Joi.string().trim().min(3).max(10000),
  category: Joi.string().valid(...categories),
}).min(1);

export const postListQuerySchema = Joi.object({
  category: Joi.string().valid(...categories),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const createCommentSchema = Joi.object({ body: Joi.string().trim().min(1).max(3000).required() });
export const updateCommentSchema = createCommentSchema;

export const reportSchema = Joi.object({
  targetType: Joi.string().valid('post', 'comment').required(),
  targetId: objectId.required(),
  reason: Joi.string().trim().min(3).max(1000).required(),
});

export const moderationSchema = Joi.object({ isHidden: Joi.boolean().required() });
export const reportStatusSchema = Joi.object({ status: Joi.string().valid('reviewed', 'dismissed').required() });
export const forumIdSchema = Joi.object({ id: objectId.required() });

export const commentListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const reportListQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'reviewed', 'dismissed').default('pending'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
