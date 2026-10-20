import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { createAlert } from '../api/alerts.js';
import ActionIcon from './ActionIcon.jsx';

function ExpertAlertForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ type: 'general', title: '', message: '', state: '', district: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(false);
    setNotice(false);
    try {
      await createAlert({
        type: form.type,
        title: form.title,
        message: form.message,
        region: { state: form.state, ...(form.district ? { district: form.district } : {}) },
      });
      setForm({ type: 'general', title: '', message: '', state: '', district: '' });
      setNotice(true);
    } catch { setError(true); }
    finally { setSaving(false); }
  };

  return (
    <Card className="expert-alert-form-card">
      <Card.Body>
        <h2>{t('expertAlertTitle')}</h2>
        <p className="page-description">{t('expertAlertDescription')}</p>
        {error && <Alert variant="danger" role="alert">{t('expertAlertError')}</Alert>}
        {notice && <Alert variant="success" role="status">{t('expertAlertPublished')}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}><Form.Group controlId="expert-alert-type"><Form.Label>{t('expertAlertType')}</Form.Label><Form.Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="general">{t('alertTypes.general')}</option><option value="pest">{t('alertTypes.pest')}</option></Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group controlId="expert-alert-state"><Form.Label>{t('expertAlertState')}</Form.Label><Form.Control required maxLength={100} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></Form.Group></Col>
            <Col md={6}><Form.Group controlId="expert-alert-district"><Form.Label>{t('expertAlertDistrict')}</Form.Label><Form.Control maxLength={100} value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></Form.Group></Col>
            <Col md={6}><Form.Group controlId="expert-alert-title"><Form.Label>{t('expertAlertTitleLabel')}</Form.Label><Form.Control required minLength={3} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Form.Group></Col>
            <Col xs={12}><Form.Group controlId="expert-alert-message"><Form.Label>{t('expertAlertMessage')}</Form.Label><Form.Control as="textarea" rows={4} required minLength={3} maxLength={2000} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Form.Group></Col>
            <Col xs={12}><Button type="submit" variant="success" disabled={saving}><ActionIcon name="check" />{saving ? t('loading') : t('expertAlertSubmit')}</Button></Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ExpertAlertForm;
