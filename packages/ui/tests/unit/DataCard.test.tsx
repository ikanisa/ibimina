import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataCard } from '../../src/components/ui/DataCard';
import { Users } from 'lucide-react';

describe('DataCard Component', () => {
  it('renders basic card', () => {
    render(
      <DataCard>
        <DataCard.Value value={123} />
      </DataCard>
    );
    
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders with header and icon', () => {
    render(
      <DataCard>
        <DataCard.Header icon={Users} title="Members" />
        <DataCard.Value value={1250} />
      </DataCard>
    );
    
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('1250')).toBeInTheDocument();
  });

  it('renders trend indicators', () => {
    render(
      <DataCard>
        <DataCard.Value value={100} trend="up" />
      </DataCard>
    );
    
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <DataCard>
        <DataCard.Value value={50} />
        <DataCard.Description>Active users</DataCard.Description>
      </DataCard>
    );
    
    expect(screen.getByText('Active users')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DataCard loading>
        <DataCard.Header title="Test" />
        <DataCard.Value value={100} />
      </DataCard>
    );
    
    // Loading skeleton should be present
    const skeletons = screen.getAllByRole('status', { hidden: true });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles onClick', () => {
    let clicked = false;
    render(
      <DataCard onClick={() => { clicked = true; }}>
        <DataCard.Value value={100} />
      </DataCard>
    );
    
    const card = screen.getByText('100').closest('div');
    card?.click();
    expect(clicked).toBe(true);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataCard className="custom-card">
        <DataCard.Value value={100} />
      </DataCard>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('custom-card');
  });
});
