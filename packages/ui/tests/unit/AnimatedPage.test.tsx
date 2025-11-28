import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedPage } from '../../src/components/ui/AnimatedPage';

describe('AnimatedPage Component', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AnimatedPage>
        <div>Page content</div>
      </AnimatedPage>
    );
    
    expect(getByText('Page content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedPage className="custom-page">
        <div>Content</div>
      </AnimatedPage>
    );
    
    const page = container.firstChild;
    expect(page).toHaveClass('custom-page');
  });

  it('has motion div wrapper', () => {
    const { container } = render(
      <AnimatedPage>
        <div>Content</div>
      </AnimatedPage>
    );
    
    // Framer Motion adds specific attributes
    const motionDiv = container.querySelector('[style]');
    expect(motionDiv).toBeInTheDocument();
  });
});
