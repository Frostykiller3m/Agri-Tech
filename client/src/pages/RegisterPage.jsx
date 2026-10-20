import { useState } from 'react';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = t('auth.nameRequired');
    if (!form.email.trim()) nextErrors.email = t('auth.emailRequired');
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t('auth.emailInvalid');
    if (!form.password) nextErrors.password = t('auth.passwordRequired');
    else if (form.password.length < 8) nextErrors.password = t('auth.passwordShort');
    if (!form.confirmPassword) nextErrors.confirmPassword = t('auth.confirmPasswordRequired');
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = t('auth.passwordsMismatch');
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
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/dashboard', { replace: true });
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
          <Card.Title as="h1">{t('auth.registerTitle')}</Card.Title>
          <Card.Text>{t('auth.registerSubtitle')}</Card.Text>
          {serverError && <Alert variant="danger" role="alert">{serverError}</Alert>}
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="register-name">
              <Form.Label>{t('auth.name')}</Form.Label>
              <Form.Control type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} isInvalid={Boolean(errors.name)} autoComplete="name" required />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-email">
              <Form.Label>{t('auth.email')}</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} isInvalid={Boolean(errors.email)} autoComplete="email" required />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-phone">
              <Form.Label>{t('auth.phone')} <span className="optional-label">({t('auth.phoneOptional')})</span></Form.Label>
              <Form.Control type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-password">
              <Form.Label>{t('auth.password')}</Form.Label>
              <Form.Control type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} isInvalid={Boolean(errors.password)} autoComplete="new-password" required />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="register-confirm-password">
              <Form.Label>{t('auth.confirmPassword')}</Form.Label>
              <Form.Control type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} isInvalid={Boolean(errors.confirmPassword)} autoComplete="new-password" required />
              <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
            </Form.Group>
            <Button type="submit" variant="success" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? t('loading') : t('auth.createAccount')}
            </Button>
          </Form>
          <p className="auth-switch">
            {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RegisterPage;
