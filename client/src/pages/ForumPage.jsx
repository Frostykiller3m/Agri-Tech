import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Pagination, Row, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { createPost, deletePost, fetchPosts, fetchReports, setPostHidden, updateReport } from '../api/forum.js';
import { useAuth } from '../context/AuthContext.jsx';
import ActionIcon from '../components/ActionIcon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const categories = ['general', 'crops', 'pests', 'soil', 'weather', 'markets'];

function ForumPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [form, setForm] = useState({ title: '', body: '', category: 'general' });
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPosts({ page, limit: 20, ...(category ? { category } : {}) });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      setError(t('forumLoadError'));
    } finally {
      setLoading(false);
    }
  }, [category, page, t]);

  const loadReports = useCallback(async () => {
    if (!isAdmin) return;
    setReportLoading(true);
    try {
      const data = await fetchReports({ page: 1, limit: 10, status: 'pending' });
      setReports(data.reports);
    } catch {
      setActionError(t('forumReportsError'));
    } finally {
      setReportLoading(false);
    }
  }, [isAdmin, t]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);
  useEffect(() => { void loadReports(); }, [loadReports]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setActionError('');
    try {
      const post = await createPost(form);
      setForm({ title: '', body: '', category: 'general' });
      if (page === 1 && (!category || category === post.category)) setPosts((current) => [post, ...current].slice(0, 20));
      else { setCategory(''); setPage(1); }
      setNotice(t('forumPostCreated'));
    } catch {
      setActionError(t('forumSaveError'));
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(t('forumDeleteConfirm'))) return;
    try {
      await deletePost(post._id);
      setPosts((current) => current.filter((item) => item._id !== post._id));
    } catch {
      setActionError(t('forumActionError'));
    }
  };

  const handleHide = async (post) => {
    try {
      const updated = await setPostHidden(post._id, !post.isHidden);
      if (!isAdmin && updated.isHidden) setPosts((current) => current.filter((item) => item._id !== updated._id));
      else setPosts((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch {
      setActionError(t('forumActionError'));
    }
  };

  const handleReportStatus = async (report, status) => {
    try {
      await updateReport(report._id, status);
      setReports((current) => current.filter((item) => item._id !== report._id));
    } catch {
      setActionError(t('forumReportsError'));
    }
  };

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <PageHeader title={t('forumTitle')} subtitle={t('forumDescription')} />
        {notice && <Alert variant="success" role="status">{notice}</Alert>}
        {actionError && <Alert variant="danger" role="alert">{actionError}</Alert>}

        <Card className="forum-compose-card">
          <Card.Body>
            <h2>{t('forumNewPost')}</h2>
            <Form onSubmit={handleCreate}>
              <Row className="g-3">
                <Col md={8}><Form.Group controlId="forum-post-title"><Form.Label>{t('forumPostTitle')}</Form.Label><Form.Control required minLength={3} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group controlId="forum-post-category"><Form.Label>{t('forumCategory')}</Form.Label><Form.Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((value) => <option key={value} value={value}>{t(`forumCategories.${value}`)}</option>)}</Form.Select></Form.Group></Col>
                <Col xs={12}><Form.Group controlId="forum-post-body"><Form.Label>{t('forumPostBody')}</Form.Label><Form.Control as="textarea" rows={4} required minLength={3} maxLength={10000} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Form.Group></Col>
                <Col><Button type="submit" variant="success"><ActionIcon name="check" />{t('forumPublish')}</Button></Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {isAdmin && (
          <section className="forum-reports" aria-labelledby="forum-reports-heading">
            <div className="section-heading"><h2 id="forum-reports-heading">{t('forumReportQueue')}</h2></div>
            {reportLoading ? <div className="forum-inline-loading"><Spinner size="sm" />{t('loading')}</div> : reports.length === 0 ? (
              <Card className="empty-card"><Card.Body>{t('forumNoReports')}</Card.Body></Card>
            ) : reports.map((report) => (
              <Card className="forum-report-card" key={report._id}>
                <Card.Body>
                  <div className="forum-report-heading"><Badge bg="warning">{t(`forumTargetTypes.${report.targetType}`)}</Badge><small>{report.reporter?.name}</small></div>
                  <p>{report.reason}</p>
                  <small>{t('forumTargetId', { id: report.targetId })}</small>
                  <div className="forum-action-row">
                    <Button size="sm" variant="outline-success" onClick={() => handleReportStatus(report, 'reviewed')}>{t('forumMarkReviewed')}</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => handleReportStatus(report, 'dismissed')}>{t('forumDismissReport')}</Button>
                    {report.targetPostId && <Button as={Link} size="sm" variant="outline-primary" to={`/forum/posts/${report.targetPostId}`}>{t('forumOpenTarget')}</Button>}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </section>
        )}

        <Form.Group className="forum-category-filter" controlId="forum-category-filter">
          <Form.Label>{t('forumFilterCategory')}</Form.Label>
          <Form.Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
            <option value="">{t('forumAllCategories')}</option>
            {categories.map((value) => <option key={value} value={value}>{t(`forumCategories.${value}`)}</option>)}
          </Form.Select>
        </Form.Group>
        {error && <Alert variant="danger" role="alert">{error}</Alert>}
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : posts.length === 0 ? (
          <EmptyState icon={<ActionIcon name="forum" />} title={t('forumEmptyTitle')} description={t('forumEmpty')} />
        ) : (
          <div className="forum-feed">
            {posts.map((post) => (
              <Card className="forum-post-card" key={post._id}>
                <Card.Body>
                  <div className="forum-post-meta">
                    <Badge bg="success-subtle" text="success">{t(`forumCategories.${post.category}`)}</Badge>
                    {post.isHidden && <Badge bg="secondary">{t('forumHidden')}</Badge>}
                    <span>{post.author?.name} · {new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <h2><Link to={`/forum/posts/${post._id}`}>{post.title}</Link></h2>
                  <p className="forum-post-preview">{post.body}</p>
                  <div className="forum-post-actions">
                    <Button as={Link} to={`/forum/posts/${post._id}`} variant="outline-success">{t('forumOpenPost')}</Button>
                    <span>{t('forumLikeCount', { count: post.likeCount })}</span>
                    {(isAdmin || post.author?._id === user?._id) && <Button size="sm" variant="outline-danger" onClick={() => handleDelete(post)}>{t('forumDelete')}</Button>}
                    {isAdmin && <Button size="sm" variant="outline-secondary" onClick={() => handleHide(post)}>{t(post.isHidden ? 'forumUnhide' : 'forumHide')}</Button>}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <Pagination className="pagination-row">
            <Pagination.Prev disabled={page <= 1} onClick={() => setPage((current) => current - 1)} />
            <Pagination.Item active>{pagination.page}</Pagination.Item>
            <Pagination.Next disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} />
          </Pagination>
        )}
      </Container>
    </main>
  );
}

export default ForumPage;
