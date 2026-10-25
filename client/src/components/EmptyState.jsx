import { Button, Card } from 'react-bootstrap';

function EmptyState({ icon, title, description, actionLabel, onAction, steps = [] }) {
  return (
    <Card className="empty-state-card">
      <Card.Body className="empty-state-body">
        {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
        <h2 className="empty-state-title">{title}</h2>
        {description && <p className="empty-state-description">{description}</p>}
        {steps.length > 0 && (
          <ol className="empty-state-steps">
            {steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
          </ol>
        )}
        {actionLabel && onAction && <Button variant="success" onClick={onAction}>{actionLabel}</Button>}
      </Card.Body>
    </Card>
  );
}

export default EmptyState;
