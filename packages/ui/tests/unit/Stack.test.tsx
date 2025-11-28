import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from '../../src/components/layout/Stack';

describe('Stack Component', () => {
  it('renders children correctly', () => {
    render(
      <Stack>
        <div>Child 1</div>
        <div>Child 2</div>
      </Stack>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('applies correct direction classes', () => {
    const { container } = render(
      <Stack direction="horizontal">
        <div>Test</div>
      </Stack>
    );
    
    const stack = container.firstChild;
    expect(stack).toHaveClass('flex-row');
  });

  it('applies correct gap classes', () => {
    const { container } = render(
      <Stack gap="lg">
        <div>Test</div>
      </Stack>
    );
    
    const stack = container.firstChild;
    expect(stack).toHaveClass('gap-6');
  });

  it('applies align and justify classes', () => {
    const { container } = render(
      <Stack align="center" justify="between">
        <div>Test</div>
      </Stack>
    );
    
    const stack = container.firstChild;
    expect(stack).toHaveClass('items-center', 'justify-between');
  });

  it('applies wrap class when wrap is true', () => {
    const { container } = render(
      <Stack wrap>
        <div>Test</div>
      </Stack>
    );
    
    const stack = container.firstChild;
    expect(stack).toHaveClass('flex-wrap');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Stack className="custom-class">
        <div>Test</div>
      </Stack>
    );
    
    const stack = container.firstChild;
    expect(stack).toHaveClass('custom-class');
  });
});
