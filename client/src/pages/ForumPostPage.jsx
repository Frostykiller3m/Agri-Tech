import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Pagination, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  createComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  reportContent,
  setPostHidden,
  togglePostLike,
  updateComment,
  updatePost,
} from '../api/forum.js';
import { useAuth } from '../context/AuthContext.jsx';

const categories = ['general', 'crops', 'pests', 'soil', 'weather', 'markets'];

function ForumPostPage() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPages, setCommentPages] = useState(1);
  const [commentBody, setCommentBody] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [postDraft, setPostDraft] = useState({ title: '', body: '', category: 'general' });
  const [editingComment, setEditingComment] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportNotice, setReportNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const value = await fetchPost(postId);
      setPost(value);
      setPostDraft({ title: value.title, body: value.body, category: value.category });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const data = await fetchComments(postId, { page: commentPage, limit: 20 });
      setComments(data.comments);
      setCommentPages(data.pagination.totalPages);
    } catch {
      setActionError(true);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentPage, postId]);

  useEffect(() => { void loadPost(); }, [loadPost]);
  useEffect(() => { void loadComments(); }, [loadComments]);

  const handleLike = async () => {
    try { setPost(await togglePostLike(post._id)); } catch { setActionError(true); }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    try {
      const comment = await createComment(post._id, commentBody);
      setCommentBody('');
      if (commentPage === 1) setComments((current) => [comment, ...current].slice(0, 20));
      else { setCommentPage(1); }
    } catch { setActionError(true); }
  };

  const handlePostSave = async (event) => {
    event.preventDefault();
    try {
      setPost(await updatePost(post._id, postDraft));
      setEditingPost(false);
    } catch { setActionError(true); }
  };

  const handlePostDelete = async () => {
    if (!window.confirm(t('forumDeleteConfirm'))) return;
    try { await deletePost(post._id); navigate('/forum', { replace: true }); } catch { setActionError(true); }
  };

  const handleCommentSave = async (commentId) => {
    try {
      const updated = await updateComment(commentId, editingComment.body);
      setComments((current) => current.map((comment) => (comment._id === updated._id ? updated : comment)));
      setEditingComment(null);
    } catch { setActionError(true); }
  };

  const handleCommentDelete = async (comment) => {
    if (!window.confirm(t('forumDeleteConfirm'))) return;
    try {
      await deleteComment(comment._id);
      setComments((current) => current.filter((item) => item._id !== comment._id));
      if (comments.length === 1 && commentPage > 1) setCommentPage((page) => page - 1);
    } catch { setActionError(true); }
  };

  const handleReport = async (event) => {
    event.preventDefault();
    try {
      await reportContent({ ...reportTarget, reason: reportReason });
      setReportTarget(null);
      setReportReason('');
      setReportNotice(t('forumReportSent'));
    } catch { setActionError(true); }
  };

  const handleHide = async () => {
    try { setPost(await setPostHidden(post._id, !post.isHidden)); } catch { setActionError(true); }
  };

  const isAuthor = post?.author?._id === user?._id;
  const canReport = !isAdmin && post && !isAuthor;

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <Button as={Link} to="/forum" variant="outline-secondary" className="mb-4">{t('forumBack')}</Button>
        {actionError && <Alert variant="danger" role="alert">{t('forumActionError')}</Alert>}
        {reportNotice && <Alert variant="success" role="status">{reportNotice}</Alert>}
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : error || !post ? (
          <Alert variant="danger" role="alert">{t('forumPostNotFound')}</Alert>
        ) : (
          <>
            <Card className="forum-detail-card">
              <Card.Body>
                <div className="forum-post-meta">
                  <Badge bg="success-subtle" text="success">{t(`forumCategories.${post.category}`)}</Badge>
                  {post.isHidden && <Badge bg="secondary">{t('forumHidden')}</Badge>}
                  <span>{post.author?.name} · {new Date(post.createdAt).toLocaleString()}</span>
                </div>
                {editingPost ? (
                  <Form onSubmit={handlePostSave} className="forum-edit-form">
                    <Form.Group controlId="forum-edit-title"><Form.Label>{t('forumPostTitle')}</Form.Label><Form.Control required minLength={3} maxLength={180} value={postDraft.title} onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })} /></Form.Group>
                    <Form.Group controlId="forum-edit-category"><Form.Label>{t('forumCategory')}</Form.Label><Form.Select value={postDraft.category} onChange={(event) => setPostDraft({ ...postDraft, category: event.target.value })}>{categories.map((value) => <option key={value} value={value}>{t(`forumCategories.${value}`)}</option>)}</Form.Select></Form.Group>
                    <Form.Group controlId="forum-edit-body"><Form.Label>{t('forumPostBody')}</Form.Label><Form.Control as="textarea" rows={7} required minLength={3} maxLength={10000} value={postDraft.body} onChange={(event) => setPostDraft({ ...postDraft, body: event.target.value })} /></Form.Group>
                    <div className="forum-action-row"><Button type="submit" variant="success">{t('forumSave')}</Button><Button variant="outline-secondary" onClick={() => { setEditingPost(false); setPostDraft({ title: post.title, body: post.body, category: post.category }); }}>{t('cancel')}</Button></div>
                  </Form>
                ) : (
                  <>
                    <h1 className="forum-detail-title">{post.title}</h1>
                    <p className="forum-detail-body">{post.body}</p>
                    <div className="forum-post-actions">
                      <Button variant={post.likedByMe ? 'success' : 'outline-success'} onClick={handleLike}>{post.likedByMe ? t('forumUnlike') : t('forumLike')} · {post.likeCount}</Button>
                      {isAuthor && <Button variant="outline-secondary" onClick={() => setEditingPost(true)}>{t('forumEdit')}</Button>}
                      {(isAuthor || isAdmin) && <Button variant="outline-danger" onClick={handlePostDelete}>{t('forumDelete')}</Button>}
                      {isAdmin && <Button variant="outline-secondary" onClick={handleHide}>{t(post.isHidden ? 'forumUnhide' : 'forumHide')}</Button>}
                      {canReport && <Button variant="outline-warning" onClick={() => setReportTarget({ targetType: 'post', targetId: post._id })}>{t('forumReport')}</Button>}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            {reportTarget && (
              <Card className="forum-report-form-card">
                <Card.Body>
                  <Form onSubmit={handleReport}>
                    <Form.Group controlId="forum-report-reason"><Form.Label>{t('forumReportReason')}</Form.Label><Form.Control as="textarea" rows={3} required minLength={3} maxLength={1000} value={reportReason} onChange={(event) => setReportReason(event.target.value)} /></Form.Group>
                    <div className="forum-action-row"><Button type="submit" variant="warning">{t('forumSubmitReport')}</Button><Button variant="outline-secondary" onClick={() => setReportTarget(null)}>{t('cancel')}</Button></div>
                  </Form>
                </Card.Body>
              </Card>
            )}

            <section className="forum-comments" aria-labelledby="forum-comments-title">
              <div className="section-heading"><h2 id="forum-comments-title">{t('forumComments')}</h2></div>
              <Card className="forum-compose-card"><Card.Body>
                <Form onSubmit={handleComment}>
                  <Form.Group controlId="forum-new-comment"><Form.Label>{t('forumAddComment')}</Form.Label><Form.Control as="textarea" rows={3} required minLength={1} maxLength={3000} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} /></Form.Group>
                  <Button className="mt-3" type="submit" variant="success">{t('forumCommentSubmit')}</Button>
                </Form>
              </Card.Body></Card>
              {commentsLoading ? <div className="forum-inline-loading"><Spinner size="sm" />{t('loading')}</div> : comments.length === 0 ? (
                <Card className="empty-card"><Card.Body>{t('forumCommentsEmpty')}</Card.Body></Card>
              ) : comments.map((comment) => {
                const ownsComment = comment.author?._id === user?._id;
                return (
                  <Card className="forum-comment-card" key={comment._id}><Card.Body>
                    <div className="forum-post-meta"><strong>{comment.author?.name}</strong><span>{new Date(comment.createdAt).toLocaleString()}</span></div>
                    {editingComment?._id === comment._id ? (
                      <Form onSubmit={(event) => { event.preventDefault(); void handleCommentSave(comment._id); }}>
                        <Form.Group controlId={`edit-comment-${comment._id}`}><Form.Label>{t('forumEditComment')}</Form.Label><Form.Control as="textarea" rows={3} required minLength={1} maxLength={3000} value={editingComment.body} onChange={(event) => setEditingComment({ ...editingComment, body: event.target.value })} /></Form.Group>
                        <div className="forum-action-row"><Button className="mt-2" size="sm" type="submit" variant="success">{t('forumSave')}</Button><Button className="mt-2" size="sm" variant="outline-secondary" onClick={() => setEditingComment(null)}>{t('cancel')}</Button></div>
                      </Form>
                    ) : <p className="forum-comment-body">{comment.body}</p>}
                    <div className="forum-action-row">
                      {ownsComment && editingComment?._id !== comment._id && <Button size="sm" variant="outline-secondary" onClick={() => setEditingComment({ _id: comment._id, body: comment.body })}>{t('forumEdit')}</Button>}
                      {(ownsComment || isAdmin) && <Button size="sm" variant="outline-danger" onClick={() => handleCommentDelete(comment)}>{t('forumDelete')}</Button>}
                      {!isAdmin && !ownsComment && <Button size="sm" variant="outline-warning" onClick={() => setReportTarget({ targetType: 'comment', targetId: comment._id })}>{t('forumReport')}</Button>}
                    </div>
                  </Card.Body></Card>
                );
              })}
              {!commentsLoading && commentPages > 1 && <Pagination className="pagination-row"><Pagination.Prev disabled={commentPage <= 1} onClick={() => setCommentPage((current) => current - 1)} /><Pagination.Item active>{commentPage}</Pagination.Item><Pagination.Next disabled={commentPage >= commentPages} onClick={() => setCommentPage((current) => current + 1)} /></Pagination>}
            </section>
          </>
        )}
      </Container>
    </main>
  );
}

export default ForumPostPage;
