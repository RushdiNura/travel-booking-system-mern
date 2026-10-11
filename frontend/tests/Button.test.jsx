import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../src/components/ui/Button.jsx';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Book now</Button>);
    expect(screen.getByRole('button', { name: 'Book now' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and shows a busy state while loading', () => {
    render(<Button loading>Submitting</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onClick while disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as a different element via the "as" prop', () => {
    render(
      <Button as="a" href="/flights">
        Search flights
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Search flights' });
    expect(link).toHaveAttribute('href', '/flights');
  });
});
