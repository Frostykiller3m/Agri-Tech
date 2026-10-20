import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../api/crops.js', () => ({
  addCropActivity: vi.fn(),
  createCrop: vi.fn(),
  deleteCrop: vi.fn(),
  deleteCropActivity: vi.fn(),
  updateCrop: vi.fn(),
}));

import '../i18n.js';
import CropTracker from './CropTracker.jsx';

describe('CropTracker', () => {
  it('validates the crop form before saving', () => {
    render(<CropTracker farmId="farm-id" crops={[]} onCropsChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save crop' }));

    expect(screen.getByText('Crop name is required.')).toBeInTheDocument();
    expect(screen.getByText('Sowing date is required.')).toBeInTheDocument();
    expect(screen.getByText('Expected harvest date is required.')).toBeInTheDocument();
  });
});
