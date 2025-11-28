import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../../src/components/ui/LoadingState';

describe('LoadingState Component', () => {
  it('renders spinner variant', () => {
    render(<LoadingState variant="spinner" />);
    // Spinner should be present
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it('renders dots variant', () => {
    render(<LoadingState variant="dots" />);
    const container = screen.getByRole('status', { hidden: true });
    expect(container).toBeInTheDocument();
  });

  it('renders pulse variant', () => {
    render(<LoadingState variant="pulse" />);
    const container = screen.getByRole('status', { hidden: true });
    expect(container).toBeInTheDocument();
  });

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" />);
    const container = screen.getByRole('status', { hidden: true });
    expect(container).toBeInTheDocument();
  });

  it('displays custom message', () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders fullscreen overlay', () => {
    const { container } = render(<LoadingState fullscreen />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('applies different sizes', () => {
    const { rerender, container } = render(<LoadingState size="sm" />);
    let spinner = container.querySelector('.w-4');
    expect(spinner).toBeInTheDocument();

    rerender(<LoadingState size="lg" />);
    spinner = container.querySelector('.w-12');
    expect(spinner).toBeInTheDocument();
  });
});
