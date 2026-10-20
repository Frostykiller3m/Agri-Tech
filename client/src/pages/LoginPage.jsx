import { useState } from 'react';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = t('auth.emailRequired');
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t('auth.emailInvalid');
    if (!form.password) nextErrors.password = t('auth.passwordRequired');
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      await login(form);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="auth-page">
      <Card className="auth-card">
        <Card.Body>
          <p className="eyebrow">{t('appName')}</p>
          <Card.Title as="h1">{t('auth.loginTitle')}</Card.Title>
          <Card.Text>{t('auth.loginSubtitle')}</Card.Text>
          {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>{t('auth.email')}</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                isInvalid={Boolean(errors.email)}
                autoComplete="email"
                required
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="login-password">
              <Form.Label>{t('auth.password')}</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                isInvalid={Boolean(errors.password)}
                autoComplete="current-password"
                required
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>
            <Button type="submit" variant="success" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? t('loading') : t('auth.signIn')}
            </Button>
          </Form>
          <p className="auth-switch">
            {t('auth.noAccount')} <Link to="/register">{t('auth.registerLink')}</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;
