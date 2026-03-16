import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { TechActionsBar } from '../TechActionsBar';

describe('TechActionsBar', () => {
  it('renders all 4 action labels', () => {
    render(<TechActionsBar />);

    expect(screen.getByText('Clear Cache')).toBeInTheDocument();
    expect(screen.getByText('Reindex All')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('Export Users')).toBeInTheDocument();
  });

  it('renders the bar container with correct test id', () => {
    render(<TechActionsBar />);

    expect(screen.getByTestId('tech-actions-bar')).toBeInTheDocument();
  });

  it('renders System Health as a link to /admin/monitor', () => {
    render(<TechActionsBar />);

    const systemHealthLink = screen.getByTestId('tech-action-system-health');
    expect(systemHealthLink.tagName).toBe('A');
    expect(systemHealthLink).toHaveAttribute('href', '/admin/monitor');
  });

  it('renders Clear Cache as a button (not a link)', () => {
    render(<TechActionsBar />);

    const clearCacheBtn = screen.getByTestId('tech-action-clear-cache');
    expect(clearCacheBtn.tagName).toBe('BUTTON');
  });

  it('renders Reindex All as a button (not a link)', () => {
    render(<TechActionsBar />);

    const reindexBtn = screen.getByTestId('tech-action-reindex-all');
    expect(reindexBtn.tagName).toBe('BUTTON');
  });

  it('renders Export Users as a button (not a link)', () => {
    render(<TechActionsBar />);

    const exportBtn = screen.getByTestId('tech-action-export-users');
    expect(exportBtn.tagName).toBe('BUTTON');
  });

  it('renders separator dots between actions', () => {
    render(<TechActionsBar />);

    const separators = screen.getAllByText('·');
    // 4 actions → 3 separators
    expect(separators).toHaveLength(3);
  });
});
