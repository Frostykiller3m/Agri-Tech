import { memo, useMemo } from 'react';
import { Alert, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from 'recharts';

import { useAuth } from '../context/AuthContext.jsx';
import { useFarmWeather } from '../hooks/useAgriQueries.js';

function weatherCodeKey(code) {
  if (code === 0) return 'clear';
  if (code === 1) return 'mainlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55].includes(code)) return 'drizzle';
  if ([56, 57].includes(code)) return 'freezingDrizzle';
  if ([61, 63, 65].includes(code)) return 'rain';
  if ([66, 67].includes(code)) return 'freezingRain';
  if ([71, 73, 75, 77].includes(code)) return 'snow';
  if ([80, 81, 82].includes(code)) return 'showers';
  if ([85, 86].includes(code)) return 'snowShowers';
  if (code === 95) return 'thunderstorm';
  if ([96, 99].includes(code)) return 'thunderstormHail';
  return 'unknown';
}

const WeatherCharts = memo(function WeatherCharts({ forecast, t }) {
  return (
    <Row className="g-3 weather-charts">
      <Col lg={7}>
        <Card className="chart-card h-100">
          <Card.Body>
            <h4>{t('temperature')}</h4>
            <div className="weather-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="max" name={t('maximum')} stroke="#e87945" />
                  <Line type="monotone" dataKey="min" name={t('minimum')} stroke="#3976b9" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={5}>
        <Card className="chart-card h-100">
          <Card.Body>
            <h4>{t('rainfall')}</h4>
            <div className="weather-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rain" name={t('rainfall')} fill="#39a9c6" />
                  <Line
                    type="monotone"
                    dataKey="chance"
                    name={t('precipitationChance')}
                    stroke="#8b59a7"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
});

function WeatherCard({ farmId }) {
  const { t } = useTranslation();
  const { weatherCacheScope } = useAuth();
  const weatherQuery = useFarmWeather(farmId, weatherCacheScope);
  const weather = weatherQuery.data;
  const error = weatherQuery.isError;
  const isLoading = weatherQuery.isLoading;

  const forecast = useMemo(() => {
    if (!weather?.daily?.time) return [];
    return weather.daily.time.map((date, index) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      min: weather.daily.temperature_2m_min?.[index],
      max: weather.daily.temperature_2m_max?.[index],
      rain: weather.daily.precipitation_sum?.[index] ?? 0,
      chance: weather.daily.precipitation_probability_max?.[index] ?? 0,
      code: weather.daily.weather_code?.[index],
    }));
  }, [weather]);

  if (isLoading) {
    return (
      <Container className="weather-loading" aria-live="polite">
        <Spinner animation="border" role="status" aria-label={t('weatherLoading')} />
        <span>{t('weatherLoading')}</span>
      </Container>
    );
  }

  return (
    <section className="weather-section" aria-labelledby="weather-title">
      <div className="section-heading">
        <h2 id="weather-title">{t('weatherTitle')}</h2>
      </div>
      {error && (
        <Alert variant="danger" role="alert">
          {t('weatherError')}
        </Alert>
      )}
      {weather && (
        <>
          {weather.stale && <Alert variant="warning">{t('weatherStale')}</Alert>}
          <Card className="weather-current-card">
            <Card.Body>
              <div className="weather-current-heading">
                <div>
                  <p className="eyebrow">{t('weatherCurrent')}</p>
                  <h3>{t(`weatherCodes.${weatherCodeKey(weather.current.weather_code)}`)}</h3>
                  <p className="weather-updated">
                    {t('weatherUpdated', { date: new Date(weather.fetchedAt).toLocaleString() })}
                  </p>
                </div>
                <strong className="weather-temperature">
                  {Math.round(weather.current.temperature_2m)}°
                </strong>
              </div>
              <Row xs={2} md={4} className="g-3 weather-metrics">
                <Col>
                  <span>{t('apparentTemperature')}</span>
                  <strong>{weather.current.apparent_temperature}°C</strong>
                </Col>
                <Col>
                  <span>{t('humidity')}</span>
                  <strong>{weather.current.relative_humidity_2m}%</strong>
                </Col>
                <Col>
                  <span>{t('windSpeed')}</span>
                  <strong>{weather.current.wind_speed_10m} km/h</strong>
                </Col>
                <Col>
                  <span>{t('rainfall')}</span>
                  <strong>{weather.current.precipitation} mm</strong>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <h3 className="weather-forecast-heading">{t('weatherForecast')}</h3>
          <Row xs={2} sm={3} lg={7} className="g-2 weather-forecast-strip">
            {forecast.map((day) => (
              <Col key={day.date}>
                <Card className="forecast-day h-100">
                  <Card.Body>
                    <strong>{day.date}</strong>
                    <span>{t(`weatherCodes.${weatherCodeKey(day.code)}`)}</span>
                    <span>
                      {Math.round(day.max)}° / {Math.round(day.min)}°C
                    </span>
                    <small>
                      {day.rain} mm · {day.chance}%
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <WeatherCharts forecast={forecast} t={t} />
        </>
      )}
    </section>
  );
}

export default WeatherCard;
