import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../src/components/ui/Surfaces.jsx';

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge variant="success">CONFIRMED</Badge>);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('defaults to the neutral variant when none is given', () => {
    render(<Badge>PENDING</Badge>);
    const badge = screen.getByText('PENDING');
    expect(badge.className).toContain('badge-neutral');
  });

  it.each(['success', 'warning', 'error', 'info', 'neutral'])('applies the %s variant class', (variant) => {
    render(<Badge variant={variant}>Label</Badge>);
    const badge = screen.getByText('Label');
    expect(badge.className).toContain(`badge-${variant}`);
  });
});
