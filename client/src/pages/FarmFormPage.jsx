import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { createFarm, fetchFarm, updateFarm } from '../api/farms.js';
import LoadingPage from '../components/LoadingPage.jsx';

const emptyForm = {
  name: '',
  district: '',
  state: '',
  areaInAcres: '',
  longitude: '',
  latitude: '',
  soilType: '',
  irrigationType: '',
};

function FarmFormPage() {
  const { t } = useTranslation();
  const { farmId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(farmId);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!farmId) return undefined;
    let active = true;
    fetchFarm(farmId)
      .then((farm) => {
        if (!active) return;
        setForm({
          name: farm.name,
          district: farm.district,
          state: farm.state,
          areaInAcres: farm.areaInAcres,
          longitude: farm.location.coordinates[0],
          latitude: farm.location.coordinates[1],
          soilType: farm.soilType,
          irrigationType: farm.irrigationType,
        });
      })
      .catch(() => {
        if (active) setServerError(t('farm.loadError'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [farmId, t]);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = t('farm.nameRequired');
    if (!form.district.trim()) nextErrors.district = t('farm.districtRequired');
    if (!form.state.trim()) nextErrors.state = t('farm.stateRequired');
    if (!(Number(form.areaInAcres) > 0)) nextErrors.areaInAcres = t('farm.areaRequired');
    if (!(Number(form.longitude) >= -180 && Number(form.longitude) <= 180)) nextErrors.longitude = t('farm.longitudeInvalid');
    if (!(Number(form.latitude) >= -90 && Number(form.latitude) <= 90)) nextErrors.latitude = t('farm.latitudeInvalid');
    if (!form.soilType) nextErrors.soilType = t('farm.soilRequired');
    if (!form.irrigationType) nextErrors.irrigationType = t('farm.irrigationRequired');
    return nextErrors;
  };

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length) return;

    const payload = {
      name: form.name,
      district: form.district,
      state: form.state,
      areaInAcres: Number(form.areaInAcres),
      location: { type: 'Point', coordinates: [Number(form.longitude), Number(form.latitude)] },
      soilType: form.soilType,
      irrigationType: form.irrigationType,
    };

    setIsSubmitting(true);
    try {
      const farm = isEditing ? await updateFarm(farmId, payload) : await createFarm(payload);
      navigate(`/farms/${farm._id}`, { replace: true });
    } catch (error) {
      setServerError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="content-page">
      <Card className="form-card">
        <Card.Body>
          <p className="eyebrow">{t('appName')}</p>
          <h1>{isEditing ? t('editFarm') : t('addFarm')}</h1>
          {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
          <Form noValidate onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-name">
                  <Form.Label>{t('farm.name')}</Form.Label>
                  <Form.Control value={form.name} onChange={updateField('name')} isInvalid={Boolean(errors.name)} required />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-area">
                  <Form.Label>{t('farm.area')}</Form.Label>
                  <Form.Control type="number" min="0.01" step="0.01" value={form.areaInAcres} onChange={updateField('areaInAcres')} isInvalid={Boolean(errors.areaInAcres)} required />
                  <Form.Control.Feedback type="invalid">{errors.areaInAcres}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-district">
                  <Form.Label>{t('farm.district')}</Form.Label>
                  <Form.Control value={form.district} onChange={updateField('district')} isInvalid={Boolean(errors.district)} required />
                  <Form.Control.Feedback type="invalid">{errors.district}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-state">
                  <Form.Label>{t('farm.state')}</Form.Label>
                  <Form.Control value={form.state} onChange={updateField('state')} isInvalid={Boolean(errors.state)} required />
                  <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <fieldset className="location-fieldset">
              <legend>{t('farm.location')}</legend>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="farm-longitude">
                    <Form.Label>{t('farm.longitude')}</Form.Label>
                    <Form.Control type="number" step="any" value={form.longitude} onChange={updateField('longitude')} isInvalid={Boolean(errors.longitude)} required />
                    <Form.Control.Feedback type="invalid">{errors.longitude}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="farm-latitude">
                    <Form.Label>{t('farm.latitude')}</Form.Label>
                    <Form.Control type="number" step="any" value={form.latitude} onChange={updateField('latitude')} isInvalid={Boolean(errors.latitude)} required />
                    <Form.Control.Feedback type="invalid">{errors.latitude}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-soil-type">
                  <Form.Label>{t('farm.soilType')}</Form.Label>
                  <Form.Select value={form.soilType} onChange={updateField('soilType')} isInvalid={Boolean(errors.soilType)} required>
                    <option value="">{t('farm.selectSoil')}</option>
                    {['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'other'].map((type) => <option key={type} value={type}>{t(`farm.types.${type}`)}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.soilType}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="farm-irrigation-type">
                  <Form.Label>{t('farm.irrigationType')}</Form.Label>
                  <Form.Select value={form.irrigationType} onChange={updateField('irrigationType')} isInvalid={Boolean(errors.irrigationType)} required>
                    <option value="">{t('farm.selectIrrigation')}</option>
                    {['rainfed', 'drip', 'sprinkler', 'canal', 'well', 'other'].map((type) => <option key={type} value={type}>{t(`farm.types.${type}`)}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.irrigationType}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <div className="form-actions">
              <Button as={Link} to="/farms" variant="outline-secondary">{t('cancel')}</Button>
              <Button type="submit" variant="success" disabled={isSubmitting}>{isSubmitting ? t('loading') : (isEditing ? t('updateFarm') : t('saveFarm'))}</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FarmFormPage;
