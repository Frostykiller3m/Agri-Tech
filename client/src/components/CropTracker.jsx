import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import PageHeader from './PageHeader.jsx';

import {
  addCropActivity,
  createCrop,
  deleteCrop,
  deleteCropActivity,
  updateCrop,
} from '../api/crops.js';

const emptyCrop = {
  name: '',
  variety: '',
  sowingDate: '',
  expectedHarvestDate: '',
  status: 'planned',
  yieldKg: '',
};

const emptyActivity = {
  type: 'irrigation',
  date: '',
  notes: '',
  quantity: '',
};

function CropTracker({ farmId, crops, onCropsChange }) {
  const { t } = useTranslation();
  const [cropForm, setCropForm] = useState(emptyCrop);
  const [activityForms, setActivityForms] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCrop = () => {
    const nextErrors = {};
    if (!cropForm.name.trim()) nextErrors.name = t('cropNameRequired');
    if (!cropForm.sowingDate) nextErrors.sowingDate = t('sowingDateRequired');
    if (!cropForm.expectedHarvestDate) nextErrors.expectedHarvestDate = t('harvestDateRequired');
    if (cropForm.sowingDate && cropForm.expectedHarvestDate && cropForm.expectedHarvestDate <= cropForm.sowingDate) {
      nextErrors.expectedHarvestDate = t('harvestDateInvalid');
    }
    return nextErrors;
  };

  const updateCropField = (field) => (event) => setCropForm({ ...cropForm, [field]: event.target.value });

  const handleCropSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateCrop();
    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    const payload = {
      ...cropForm,
      farmId,
      yieldKg: cropForm.yieldKg === '' ? undefined : Number(cropForm.yieldKg),
    };
    try {
      const crop = editingId ? await updateCrop(editingId, payload) : await createCrop(payload);
      onCropsChange(editingId ? crops.map((item) => (item._id === crop._id ? crop : item)) : [crop, ...crops]);
      setCropForm(emptyCrop);
      setEditingId(null);
      setErrors({});
    } catch (error) {
      setRequestError(t('cropSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (crop) => {
    setCropForm({
      name: crop.name,
      variety: crop.variety || '',
      sowingDate: crop.sowingDate.slice(0, 10),
      expectedHarvestDate: crop.expectedHarvestDate.slice(0, 10),
      status: crop.status,
      yieldKg: crop.yieldKg ?? '',
    });
    setEditingId(crop._id);
  };

  const handleDelete = async (crop) => {
    if (!window.confirm(t('cropDeleteConfirm', { name: crop.name }))) return;
    try {
      await deleteCrop(crop._id);
      onCropsChange(crops.filter((item) => item._id !== crop._id));
    } catch {
      setRequestError(t('cropDeleteError'));
    }
  };

  const activityFormFor = (cropId) => activityForms[cropId] || emptyActivity;
  const updateActivityField = (cropId, field) => (event) => setActivityForms({
    ...activityForms,
    [cropId]: { ...activityFormFor(cropId), [field]: event.target.value },
  });

  const handleActivitySubmit = async (event, crop) => {
    event.preventDefault();
    const form = activityFormFor(crop._id);
    if (!form.date) return;
    try {
      const updated = await addCropActivity(crop._id, {
        ...form,
        quantity: form.quantity === '' ? undefined : Number(form.quantity),
      });
      onCropsChange(crops.map((item) => (item._id === updated._id ? updated : item)));
      setActivityForms({ ...activityForms, [crop._id]: emptyActivity });
    } catch (error) {
      setRequestError(t('cropSaveError'));
    }
  };

  const handleActivityDelete = async (crop, activityId) => {
    try {
      const updated = await deleteCropActivity(crop._id, activityId);
      onCropsChange(crops.map((item) => (item._id === updated._id ? updated : item)));
    } catch (error) {
      setRequestError(t('cropSaveError'));
    }
  };

  return (
    <section className="crop-tracker" aria-labelledby="crop-tracker-title">
      <PageHeader as="h2" titleId="crop-tracker-title" title={t('cropTrackerTitle')} subtitle={t('cropTrackerDescription')} />
      {requestError && <Alert variant="danger" role="alert">{requestError}</Alert>}
      <Card className="form-card crop-form-card">
        <Card.Body>
          <h3>{editingId ? t('editCrop') : t('addCrop')}</h3>
          <Form noValidate onSubmit={handleCropSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-name">
                  <Form.Label>{t('cropName')}</Form.Label>
                  <Form.Control value={cropForm.name} onChange={updateCropField('name')} isInvalid={Boolean(errors.name)} required />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-variety">
                  <Form.Label>{t('cropVariety')}</Form.Label>
                  <Form.Control value={cropForm.variety} onChange={updateCropField('variety')} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-sowing-date">
                  <Form.Label>{t('sowingDate')}</Form.Label>
                  <Form.Control type="date" value={cropForm.sowingDate} onChange={updateCropField('sowingDate')} isInvalid={Boolean(errors.sowingDate)} required />
                  <Form.Control.Feedback type="invalid">{errors.sowingDate}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-harvest-date">
                  <Form.Label>{t('expectedHarvestDate')}</Form.Label>
                  <Form.Control type="date" value={cropForm.expectedHarvestDate} onChange={updateCropField('expectedHarvestDate')} isInvalid={Boolean(errors.expectedHarvestDate)} required />
                  <Form.Control.Feedback type="invalid">{errors.expectedHarvestDate}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-status">
                  <Form.Label>{t('cropStatus')}</Form.Label>
                  <Form.Select value={cropForm.status} onChange={updateCropField('status')}>
                    {['planned', 'growing', 'harvested', 'failed'].map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="crop-yield">
                  <Form.Label>{t('yieldKg')}</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" value={cropForm.yieldKg} onChange={updateCropField('yieldKg')} />
                </Form.Group>
              </Col>
            </Row>
            <div className="form-actions">
              {editingId && <Button variant="outline-secondary" onClick={() => { setEditingId(null); setCropForm(emptyCrop); }}>{t('cancel')}</Button>}
              <Button type="submit" variant="success" disabled={isSubmitting}>{isSubmitting ? t('loading') : (editingId ? t('updateCrop') : t('saveCrop'))}</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      {crops.length === 0 && <Card className="empty-card"><Card.Body>{t('cropEmpty')}</Card.Body></Card>}
      <Row xs={1} lg={2} className="g-4 mt-1">
        {crops.map((crop) => (
          <Col key={crop._id}>
            <Card className="crop-card h-100">
              <Card.Body>
                <div className="crop-card-heading">
                  <div>
                    <Card.Title>{crop.name}</Card.Title>
                    {crop.variety && <Card.Subtitle className="mb-2 text-muted">{crop.variety}</Card.Subtitle>}
                  </div>
                  <Badge bg={crop.status === 'failed' ? 'danger' : crop.status === 'harvested' ? 'success' : 'primary'}>{t(`statuses.${crop.status}`)}</Badge>
                </div>
                <p className="crop-dates">{t('sowingDate')}: {crop.sowingDate.slice(0, 10)} · {t('expectedHarvestDate')}: {crop.expectedHarvestDate.slice(0, 10)}</p>
                <div className="d-flex gap-2 mb-3">
                  <Button size="sm" variant="outline-secondary" onClick={() => beginEdit(crop)}>{t('editCrop')}</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(crop)}>{t('deleteCrop')}</Button>
                </div>
                <h4>{t('activityLog')}</h4>
                {crop.activityLog?.length ? (
                  <ul className="activity-timeline">
                    {crop.activityLog.map((activity) => (
                      <li key={activity._id}>
                        <div><strong>{t(`activityTypes.${activity.type}`)}</strong> · {activity.date.slice(0, 10)}</div>
                        {activity.notes && <div>{activity.notes}</div>}
                        {activity.quantity !== undefined && <small>{t('activityQuantity')}: {activity.quantity}</small>}
                        <Button size="sm" variant="link" className="p-0" onClick={() => handleActivityDelete(crop, activity._id)}>{t('deleteActivity')}</Button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted">{t('noActivities')}</p>}
                <Form onSubmit={(event) => handleActivitySubmit(event, crop)} className="activity-form">
                  <h5>{t('addActivity')}</h5>
                  <Row>
                    <Col sm={6}>
                      <Form.Group className="mb-2" controlId={`activity-type-${crop._id}`}>
                        <Form.Label>{t('activityType')}</Form.Label>
                        <Form.Select value={activityFormFor(crop._id).type} onChange={updateActivityField(crop._id, 'type')}>
                          {['irrigation', 'fertilizer', 'pesticide', 'other'].map((type) => <option key={type} value={type}>{t(`activityTypes.${type}`)}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group className="mb-2" controlId={`activity-date-${crop._id}`}>
                        <Form.Label>{t('activityDate')}</Form.Label>
                        <Form.Control type="date" value={activityFormFor(crop._id).date} onChange={updateActivityField(crop._id, 'date')} required />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-2" controlId={`activity-notes-${crop._id}`}>
                    <Form.Label>{t('activityNotes')}</Form.Label>
                    <Form.Control value={activityFormFor(crop._id).notes} onChange={updateActivityField(crop._id, 'notes')} />
                  </Form.Group>
                  <Button type="submit" size="sm" variant="outline-success">{t('addActivity')}</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
}

export default CropTracker;
