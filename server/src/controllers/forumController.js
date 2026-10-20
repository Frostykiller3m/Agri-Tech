import {
  createComment,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  getPost,
  listComments,
  listPosts,
  listReports,
  moderatePost,
  togglePostLike,
  updateComment,
  updatePost,
  updateReportStatus,
} from '../services/forumService.js';

export async function getPosts(request, response) {
  const data = await listPosts(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function getPostById(request, response) {
  const post = await getPost(request.user, request.params.id);
  response.status(200).json({ success: true, data: { post } });
}

export async function createPostRoute(request, response) {
  const post = await createPost(request.user, request.body);
  response.status(201).json({ success: true, data: { post } });
}

export async function updatePostRoute(request, response) {
  const post = await updatePost(request.user, request.params.id, request.body);
  response.status(200).json({ success: true, data: { post } });
}

export async function deletePostRoute(request, response) {
  await deletePost(request.user, request.params.id);
  response.status(204).send();
}

export async function likePost(request, response) {
  const post = await togglePostLike(request.user, request.params.id);
  response.status(200).json({ success: true, data: { post } });
}

export async function getComments(request, response) {
  const data = await listComments(request.user, request.params.id, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function addComment(request, response) {
  const comment = await createComment(request.user, request.params.id, request.body.body);
  response.status(201).json({ success: true, data: { comment } });
}

export async function editComment(request, response) {
  const comment = await updateComment(request.user, request.params.id, request.body.body);
  response.status(200).json({ success: true, data: { comment } });
}

export async function removeComment(request, response) {
  await deleteComment(request.user, request.params.id);
  response.status(204).send();
}

export async function reportContent(request, response) {
  const report = await createReport(request.user, request.body);
  response.status(201).json({ success: true, data: { report } });
}

export async function hidePost(request, response) {
  const post = await moderatePost(request.user, request.params.id, request.body.isHidden);
  response.status(200).json({ success: true, data: { post } });
}

export async function getReports(request, response) {
  const data = await listReports(request.user, request.validatedQuery);
  response.status(200).json({ success: true, data });
}

export async function reviewReport(request, response) {
  const report = await updateReportStatus(request.user, request.params.id, request.body.status);
  response.status(200).json({ success: true, data: { report } });
}
