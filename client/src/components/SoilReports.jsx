import { memo, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  createSoilReport,
  deleteSoilReport,
  fetchSoilRecommendations,
  fetchSoilReports,
} from '../api/soil.js';

const parameters = ['pH', 'nitrogen', 'phosphorus', 'potassium', 'moisture', 'organicCarbon'];
const defaultValues = {
  pH: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  moisture: '',
  organicCarbon: '',
};

const SoilTrendChart = memo(function SoilTrendChart({ chartData, label }) {
  return (
    <Card className="chart-card">
      <Card.Body>
        <div className="soil-chart" role="img" aria-label={label}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sampleDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pH" stroke="#2f8a55" />
              <Line type="monotone" dataKey="nitrogen" stroke="#3976b9" />
              <Line type="monotone" dataKey="phosphorus" stroke="#c57b24" />
              <Line type="monotone" dataKey="potassium" stroke="#8b59a7" />
              <Line type="monotone" dataKey="moisture" stroke="#39a9c6" />
              <Line type="monotone" dataKey="organicCarbon" stroke="#9b5848" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
});

function SoilReports({ farmId }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState(defaultValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState(null);
  const [recommendationError, setRecommendationError] = useState('');

  useEffect(() => {
    let active = true;
    fetchSoilReports(farmId)
      .then((data) => {
        if (active) setReports(data.reports);
      })
      .catch(() => {
        if (active) setLoadError(t('soilLoadError'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [farmId, t]);

  const chartData = useMemo(
    () =>
      [...reports]
        .sort((first, second) => new Date(first.date) - new Date(second.date))
        .map((report) => ({
          ...report,
          sampleDate: new Date(report.date).toLocaleDateString(),
        })),
    [reports],
  );

  const validate = () => {
    const nextErrors = {};
    if (!reportDate) nextErrors.date = t('soilReportDate');
    for (const parameter of parameters) {
      const value = Number(values[parameter]);
      const max =
        parameter === 'pH'
          ? 14
          : parameter === 'nitrogen' || parameter === 'phosphorus' || parameter === 'potassium'
            ? 10000
            : 100;
      if (values[parameter] === '' || !Number.isFinite(value) || value < 0 || value > max) {
        nextErrors[parameter] = t('soilSaveError');
      }
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setSaveError('');
    if (Object.keys(nextErrors).length) return;

    setIsSaving(true);
    try {
      const report = await createSoilReport({
        farmId,
        date: reportDate,
        ...Object.fromEntries(
          parameters.map((parameter) => [parameter, Number(values[parameter])]),
        ),
      });
      setReports((existing) => [report, ...existing]);
      setValues(defaultValues);
      setFieldErrors({});
    } catch (error) {
      setSaveError(t('soilSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(t('soilDeleteConfirm'))) return;
    try {
      await deleteSoilReport(report._id);
      setReports((existing) => existing.filter((item) => item._id !== report._id));
      if (selectedRecommendations?.reportId === report._id) setSelectedRecommendations(null);
    } catch {
      setSaveError(t('soilDeleteError'));
    }
  };

  const showRecommendations = async (report) => {
    setRecommendationError('');
    try {
      const recommendations = await fetchSoilRecommendations(report._id);
      setSelectedRecommendations({ reportId: report._id, recommendations });
    } catch {
      setRecommendationError(t('soilRecommendationError'));
    }
  };

  if (isLoading)
    return (
      <div className="soil-loading" role="status">
        {t('loading')}
      </div>
    );

  return (
    <section className="soil-section" aria-labelledby="soil-reports-title">
      <div className="section-heading">
        <h2 id="soil-reports-title">{t('soilReportsTitle')}</h2>
        <p className="page-description">{t('soilReportsDescription')}</p>
      </div>
      {loadError && (
        <Alert variant="danger" role="alert">
          {loadError}
        </Alert>
      )}
      {saveError && (
        <Alert variant="danger" role="alert">
          {saveError}
        </Alert>
      )}
      <Card className="form-card soil-form-card">
        <Card.Body>
          <h3>{t('addSoilReport')}</h3>
          <Form noValidate onSubmit={handleSubmit}>
            <Row>
              <Col md={6} lg={4}>
                <Form.Group className="mb-3" controlId="soil-date">
                  <Form.Label>{t('soilReportDate')}</Form.Label>
                  <Form.Control
                    type="date"
                    value={reportDate}
                    onChange={(event) => setReportDate(event.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              {parameters.map((parameter) => (
                <Col md={6} lg={4} key={parameter}>
                  <Form.Group className="mb-3" controlId={`soil-${parameter}`}>
                    <Form.Label>
                      {t(`soil${parameter[0].toUpperCase()}${parameter.slice(1)}`)}
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max={
                        parameter === 'pH'
                          ? 14
                          : parameter === 'nitrogen' ||
                              parameter === 'phosphorus' ||
                              parameter === 'potassium'
                            ? 10000
                            : 100
                      }
                      step="any"
                      value={values[parameter]}
                      onChange={(event) =>
                        setValues({ ...values, [parameter]: event.target.value })
                      }
                      isInvalid={Boolean(fieldErrors[parameter])}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors[parameter]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ))}
            </Row>
            <Button type="submit" variant="success" disabled={isSaving}>
              {isSaving ? t('loading') : t('saveSoilReport')}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {selectedRecommendations && (
        <Card className="recommendation-card">
          <Card.Body>
            <h3>{t('soilRecommendationsTitle')}</h3>
            {selectedRecommendations.recommendations.map((recommendation) => (
              <div className="recommendation-row" key={recommendation.parameter}>
                <div className="recommendation-heading">
                  <strong>{t(`soilParameters.${recommendation.parameter}`)}</strong>
                  <Badge
                    bg={
                      recommendation.status === 'optimal'
                        ? 'success'
                        : recommendation.status === 'high'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {t(`soilStatus.${recommendation.status}`)}
                  </Badge>
                </div>
                <p>{recommendation.advice}</p>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}
      {recommendationError && (
        <Alert variant="danger" role="alert">
          {recommendationError}
        </Alert>
      )}

      <h3 className="soil-history-heading">{t('soilHistory')}</h3>
      {reports.length === 0 ? (
        <Card className="empty-card">
          <Card.Body>{t('soilEmpty')}</Card.Body>
        </Card>
      ) : (
        <>
          <SoilTrendChart chartData={chartData} label={t('soilReportsDescription')} />
          <div className="table-responsive">
            <Table striped hover className="soil-table align-middle">
              <thead>
                <tr>
                  <th>{t('soilReportDate')}</th>
                  {parameters.map((parameter) => (
                    <th key={parameter}>{t(`soilParameters.${parameter}`)}</th>
                  ))}
                  <th aria-label={t('soilRecommendationsButton')} />
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{new Date(report.date).toLocaleDateString()}</td>
                    {parameters.map((parameter) => (
                      <td key={parameter}>{report[parameter]}</td>
                    ))}
                    <td className="soil-actions">
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => showRecommendations(report)}
                      >
                        {t('soilRecommendationsButton')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(report)}
                      >
                        {t('soilDelete')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

export default SoilReports;
