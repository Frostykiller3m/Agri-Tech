import { memo, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Pagination,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  fetchAdminOrders,
  fetchAdminReports,
  fetchAdminResources,
  fetchAdminStats,
  fetchAdminUsers,
  publishAdminAlert,
  setAdminOrderStatus,
  setAdminReportStatus,
  setAdminResourceStatus,
  updateAdminUser,
} from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';

const sections = ['overview', 'users', 'resources', 'orders', 'alerts', 'reports'];

const AdminOverviewCharts = memo(function AdminOverviewCharts({ ordersByStatus, signups, t }) {
  return (
    <Row className="g-3 mt-1">
      <Col xl={6}>
        <Card className="admin-chart-card">
          <Card.Body>
            <h3>{t('adminOrdersChart')}</h3>
            <div className="admin-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tickFormatter={(value) => t(`orderStatuses.${value}`)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(value) => t(`orderStatuses.${value}`)} />
                  <Bar dataKey="count" fill="#2f8a55" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col xl={6}>
        <Card className="admin-chart-card">
          <Card.Body>
            <h3>{t('adminSignupsChart')}</h3>
            <div className="admin-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2f8a55"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
});

function AdminUserRow({ user, onUpdate, t, isCurrentUser }) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const update = async (changes) => {
    setSaving(true);
    setError(false);
    try {
      onUpdate(await updateAdminUser(user._id, changes));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td>
        <strong>{user.name}</strong>
        <div className="admin-table-secondary">{user.email}</div>
      </td>
      <td>
        <Form.Select
          aria-label={t('adminRoleFor', { name: user.name })}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={saving}
        >
          <option value="farmer">{t('adminRoles.farmer')}</option>
          <option value="expert">{t('adminRoles.expert')}</option>
          <option value="admin">{t('adminRoles.admin')}</option>
        </Form.Select>
        <Button
          className="mt-2"
          size="sm"
          variant="outline-secondary"
          disabled={saving || role === user.role}
          onClick={() => void update({ role })}
        >
          {t('adminUpdateRole')}
        </Button>
      </td>
      <td>
        <Badge bg={user.isActive ? 'success' : 'secondary'}>
          {t(user.isActive ? 'adminActive' : 'adminInactive')}
        </Badge>
      </td>
      <td>
        <Button
          size="sm"
          variant={user.isActive ? 'outline-danger' : 'outline-success'}
          disabled={saving || (isCurrentUser && user.isActive)}
          onClick={() => void update({ isActive: !user.isActive })}
        >
          {t(user.isActive ? 'adminDeactivate' : 'adminActivate')}
        </Button>
        {isCurrentUser && <div className="admin-table-secondary">{t('adminCurrentUser')}</div>}
        {error && <div className="text-danger small">{t('adminActionError')}</div>}
      </td>
    </tr>
  );
}

function AdminOrderRow({ order, onUpdate, t }) {
  const [nextStatus, setNextStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const transitions = {
    placed: ['approved', 'cancelled'],
    approved: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  const options = transitions[order.status] || [];
  const update = async () => {
    if (!nextStatus) return;
    setSaving(true);
    setError(false);
    try {
      onUpdate(await setAdminOrderStatus(order._id, nextStatus));
      setNextStatus('');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <tr>
      <td>
        #{order._id.slice(-8)}
        <div className="admin-table-secondary">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td>
        {order.user?.name}
        <div className="admin-table-secondary">{order.user?.email}</div>
      </td>
      <td>{t(`orderStatuses.${order.status}`)}</td>
      <td>{t('orderTotalValue', { amount: order.total.toFixed(2) })}</td>
      <td>
        <div className="admin-inline-action">
          <Form.Select
            aria-label={t('adminNextOrderStatus')}
            value={nextStatus}
            disabled={!options.length || saving}
            onChange={(event) => setNextStatus(event.target.value)}
          >
            <option value="">{t('adminChooseAction')}</option>
            {options.map((status) => (
              <option key={status} value={status}>
                {t(`orderStatuses.${status}`)}
              </option>
            ))}
          </Form.Select>
          <Button
            size="sm"
            variant="outline-success"
            disabled={!nextStatus || saving}
            onClick={() => void update()}
          >
            {t('adminApply')}
          </Button>
        </div>
        {error && <div className="text-danger small">{t('adminActionError')}</div>}
      </td>
    </tr>
  );
}

function AdminPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [notice, setNotice] = useState('');
  const [alertForm, setAlertForm] = useState({
    type: 'general',
    severity: 'medium',
    title: '',
    message: '',
    state: '',
    district: '',
    cropFilter: '',
    expiresAt: '',
  });
  const [alertSaving, setAlertSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const load = async () => {
      try {
        let result;
        if (section === 'overview') result = await fetchAdminStats();
        else if (section === 'users')
          result = await fetchAdminUsers({ page, limit: 20, ...(search ? { search } : {}) });
        else if (section === 'resources')
          result = await fetchAdminResources({ page, limit: 20, status: 'pending' });
        else if (section === 'orders') result = await fetchAdminOrders({ page, limit: 20 });
        else if (section === 'reports')
          result = await fetchAdminReports({ page, limit: 20, status: 'pending' });
        if (active) setData(result);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [page, search, section]);

  const changeSection = (value) => {
    setSection(value);
    setPage(1);
    setData(null);
    setError(false);
    setActionError(false);
    setNotice('');
  };

  const updateUser = (updated) =>
    setData((current) => ({
      ...current,
      users: current.users.map((item) => (item._id === updated._id ? updated : item)),
    }));
  const updateResource = async (resource, status) => {
    setActionError(false);
    try {
      await setAdminResourceStatus(resource._id, status);
      setData((current) => ({
        ...current,
        resources: current.resources.filter((item) => item._id !== resource._id),
      }));
    } catch {
      setActionError(true);
    }
  };
  const updateOrder = (updated) =>
    setData((current) => ({
      ...current,
      orders: current.orders.map((item) => (item._id === updated._id ? updated : item)),
    }));
  const updateReport = async (report, status) => {
    setActionError(false);
    try {
      await setAdminReportStatus(report._id, status);
      setData((current) => ({
        ...current,
        reports: current.reports.filter((item) => item._id !== report._id),
      }));
    } catch {
      setActionError(true);
    }
  };
  const submitAlert = async (event) => {
    event.preventDefault();
    setAlertSaving(true);
    setActionError(false);
    setNotice('');
    try {
      await publishAdminAlert({
        type: alertForm.type,
        severity: alertForm.severity,
        title: alertForm.title,
        message: alertForm.message,
        region: {
          state: alertForm.state,
          ...(alertForm.district ? { district: alertForm.district } : {}),
        },
        cropFilter: alertForm.cropFilter
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        ...(alertForm.expiresAt ? { expiresAt: new Date(alertForm.expiresAt).toISOString() } : {}),
      });
      setAlertForm({
        type: 'general',
        severity: 'medium',
        title: '',
        message: '',
        state: '',
        district: '',
        cropFilter: '',
        expiresAt: '',
      });
      setNotice(t('adminAlertPublished'));
    } catch {
      setActionError(true);
    } finally {
      setAlertSaving(false);
    }
  };

  const pageCount = data?.pagination?.totalPages || 1;
  const renderPagination = () =>
    pageCount > 1 && (
      <Pagination className="pagination-row">
        <Pagination.Prev disabled={page <= 1} onClick={() => setPage((value) => value - 1)} />
        <Pagination.Item active>{page}</Pagination.Item>
        <Pagination.Next
          disabled={page >= pageCount}
          onClick={() => setPage((value) => value + 1)}
        />
      </Pagination>
    );
  const heading = t(`adminSections.${section}`);

  return (
    <main id="main-content" tabIndex="-1" className="content-page admin-page">
      <Container fluid="lg">
        <p className="eyebrow">{t('navAdmin')}</p>
        <h1 className="admin-title">{t('adminTitle')}</h1>
        <div className="admin-layout">
          <nav className="admin-sidebar" aria-label={t('adminNavigation')}>
            {sections.map((value) => (
              <Button
                key={value}
                variant={section === value ? 'success' : 'outline-success'}
                className="admin-sidebar-link"
                onClick={() => changeSection(value)}
              >
                {t(`adminSections.${value}`)}
              </Button>
            ))}
          </nav>
          <section className="admin-main" aria-labelledby="admin-panel-title">
            <div className="admin-panel-heading">
              <h2 id="admin-panel-title">{heading}</h2>
            </div>
            {actionError && (
              <Alert variant="danger" role="alert">
                {t('adminActionError')}
              </Alert>
            )}
            {notice && (
              <Alert variant="success" role="status">
                {notice}
              </Alert>
            )}
            {loading ? (
              <div className="state-page" role="status">
                <Spinner animation="border" />
                <span>{t('loading')}</span>
              </div>
            ) : error ? (
              <Alert variant="danger" role="alert">
                {t('adminLoadError')}
              </Alert>
            ) : section === 'overview' ? (
              <>
                <Row className="g-3 admin-stat-grid">
                  {[
                    ['users', 'users'],
                    ['farms', 'farms'],
                    ['activeCrops', 'activeCrops'],
                    ['openConsultations', 'openConsultations'],
                    ['pendingReports', 'pendingReports'],
                  ].map(([key, label]) => (
                    <Col xs={12} sm={6} xl={4} key={key}>
                      <Card className="admin-stat-card">
                        <Card.Body>
                          <span>{t(`adminStats.${label}`)}</span>
                          <strong>{data.counts[key]}</strong>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <AdminOverviewCharts
                  ordersByStatus={data.ordersByStatus}
                  signups={data.signups}
                  t={t}
                />
              </>
            ) : section === 'users' ? (
              <>
                <Form
                  className="admin-search"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setPage(1);
                    setSearch(searchInput.trim());
                  }}
                >
                  <Form.Control
                    aria-label={t('adminSearchUsers')}
                    placeholder={t('adminSearchUsers')}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  <Button type="submit" variant="success">
                    {t('resourceSearchButton')}
                  </Button>
                </Form>
                {data.users.length === 0 ? (
                  <Card className="empty-card">
                    <Card.Body>{t('adminUsersEmpty')}</Card.Body>
                  </Card>
                ) : (
                  <div className="admin-table-wrap">
                    <Table responsive hover className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('adminUser')}</th>
                          <th>{t('adminRole')}</th>
                          <th>{t('adminAccountStatus')}</th>
                          <th>{t('adminActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.map((user) => (
                          <AdminUserRow
                            key={user._id}
                            user={user}
                            onUpdate={updateUser}
                            t={t}
                            isCurrentUser={user._id === currentUser?._id}
                          />
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {renderPagination()}
              </>
            ) : section === 'resources' ? (
              <>
                {data.resources.length === 0 ? (
                  <Card className="empty-card">
                    <Card.Body>{t('adminResourcesEmpty')}</Card.Body>
                  </Card>
                ) : (
                  <div className="admin-table-wrap">
                    <Table responsive hover className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('resourceName')}</th>
                          <th>{t('resourceCategory')}</th>
                          <th>{t('resourcePrice')}</th>
                          <th>{t('adminSubmittedBy')}</th>
                          <th>{t('adminActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.resources.map((resource) => (
                          <tr key={resource._id}>
                            <td>
                              <strong>{resource.name}</strong>
                              <div className="admin-table-secondary">{resource.description}</div>
                            </td>
                            <td>{t(`resourceCategories.${resource.category}`)}</td>
                            <td>
                              {t('resourcePriceValue', {
                                price: resource.price,
                                unit: resource.unit,
                              })}
                            </td>
                            <td>{resource.createdBy?.name}</td>
                            <td>
                              <div className="admin-action-group">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => void updateResource(resource, 'approved')}
                                >
                                  {t('resourceApprove')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => void updateResource(resource, 'rejected')}
                                >
                                  {t('resourceReject')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {renderPagination()}
              </>
            ) : section === 'orders' ? (
              <>
                {data.orders.length === 0 ? (
                  <Card className="empty-card">
                    <Card.Body>{t('adminOrdersEmpty')}</Card.Body>
                  </Card>
                ) : (
                  <div className="admin-table-wrap">
                    <Table responsive hover className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('adminOrder')}</th>
                          <th>{t('adminCustomer')}</th>
                          <th>{t('orderStatusLabel')}</th>
                          <th>{t('adminTotal')}</th>
                          <th>{t('adminActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.orders.map((order) => (
                          <AdminOrderRow
                            key={order._id}
                            order={order}
                            onUpdate={updateOrder}
                            t={t}
                          />
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {renderPagination()}
              </>
            ) : section === 'alerts' ? (
              <Card className="admin-form-card">
                <Card.Body>
                  <p className="page-description">{t('adminAlertDescription')}</p>
                  <Form onSubmit={submitAlert}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-type">
                          <Form.Label>{t('alertTypeLabel')}</Form.Label>
                          <Form.Select
                            value={alertForm.type}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, type: event.target.value })
                            }
                          >
                            {['general', 'weather', 'pest'].map((value) => (
                              <option key={value} value={value}>
                                {t(`alertTypes.${value}`)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-severity">
                          <Form.Label>{t('alertSeverityLabel')}</Form.Label>
                          <Form.Select
                            value={alertForm.severity}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, severity: event.target.value })
                            }
                          >
                            {['low', 'medium', 'high', 'critical'].map((value) => (
                              <option key={value} value={value}>
                                {t(`severity.${value}`)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-title">
                          <Form.Label>{t('alertTitleLabel')}</Form.Label>
                          <Form.Control
                            required
                            minLength={3}
                            maxLength={140}
                            value={alertForm.title}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, title: event.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-state">
                          <Form.Label>{t('adminState')}</Form.Label>
                          <Form.Control
                            required
                            maxLength={100}
                            value={alertForm.state}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, state: event.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-district">
                          <Form.Label>{t('adminDistrictOptional')}</Form.Label>
                          <Form.Control
                            maxLength={100}
                            value={alertForm.district}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, district: event.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-crops">
                          <Form.Label>{t('adminCropFilter')}</Form.Label>
                          <Form.Control
                            value={alertForm.cropFilter}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, cropFilter: event.target.value })
                            }
                          />
                          <Form.Text>{t('adminCropFilterHelp')}</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group controlId="admin-alert-message">
                          <Form.Label>{t('alertMessageLabel')}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            required
                            minLength={3}
                            maxLength={2000}
                            value={alertForm.message}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, message: event.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="admin-alert-expires">
                          <Form.Label>{t('adminExpiresAt')}</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            value={alertForm.expiresAt}
                            onChange={(event) =>
                              setAlertForm({ ...alertForm, expiresAt: event.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Button type="submit" variant="success" disabled={alertSaving}>
                          {alertSaving ? t('loading') : t('adminPublishAlert')}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              <>
                {data.reports.length === 0 ? (
                  <Card className="empty-card">
                    <Card.Body>{t('adminReportsEmpty')}</Card.Body>
                  </Card>
                ) : (
                  <div className="admin-table-wrap">
                    <Table responsive hover className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('adminReportTarget')}</th>
                          <th>{t('forumReportReason')}</th>
                          <th>{t('adminSubmittedBy')}</th>
                          <th>{t('adminReportedAt')}</th>
                          <th>{t('adminActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.reports.map((report) => (
                          <tr key={report._id}>
                            <td>
                              <Badge bg="warning">
                                {t(`forumTargetTypes.${report.targetType}`)}
                              </Badge>
                              {report.targetPostId && (
                                <div>
                                  <Link to={`/forum/posts/${report.targetPostId}`}>
                                    {t('forumOpenTarget')}
                                  </Link>
                                </div>
                              )}
                            </td>
                            <td>{report.reason}</td>
                            <td>{report.reporter?.name}</td>
                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-action-group">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => void updateReport(report, 'reviewed')}
                                >
                                  {t('forumMarkReviewed')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => void updateReport(report, 'dismissed')}
                                >
                                  {t('forumDismissReport')}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {renderPagination()}
              </>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}

export default AdminPage;
