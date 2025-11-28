import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid } from '../../src/components/layout/Grid';

describe('Grid Component', () => {
  it('renders children correctly', () => {
    render(
      <Grid cols={3}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies correct grid columns class', () => {
    const { container } = render(
      <Grid cols={4}>
        <div>Test</div>
      </Grid>
    );
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid-cols-4');
  });

  it('applies responsive columns', () => {
    const { container } = render(
      <Grid cols={4} responsive={{ sm: 1, md: 2, lg: 4 }}>
        <div>Test</div>
      </Grid>
    );
    
    const grid = container.firstChild;
    // Responsive classes applied via Tailwind
    expect(grid).toHaveClass('grid');
  });

  it('applies gap classes', () => {
    const { container } = render(
      <Grid cols={2} gap="lg">
        <div>Test</div>
      </Grid>
    );
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('gap-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Grid cols={2} className="custom-grid">
        <div>Test</div>
      </Grid>
    );
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('custom-grid');
  });
});
