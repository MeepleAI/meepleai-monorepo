/**
 * Pricing Page — unit tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PricingPage from '../page';

describe('PricingPage', () => {
  it('renders the page heading', () => {
    render(<PricingPage />);
    expect(screen.getByText('Scegli il tuo piano')).toBeInTheDocument();
  });

  it('renders three tier cards', () => {
    render(<PricingPage />);

    expect(screen.getByTestId('cta-free')).toBeInTheDocument();
    expect(screen.getByTestId('cta-premium')).toBeInTheDocument();
    expect(screen.getByTestId('cta-contributor')).toBeInTheDocument();
  });

  it('links Free CTA to register page', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('cta-free')).toHaveAttribute('href', '/auth/register');
  });

  it('links Premium CTA to register page with plan param', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('cta-premium')).toHaveAttribute(
      'href',
      '/auth/register?plan=premium'
    );
  });

  it('links Contributor CTA to proposals', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('cta-contributor')).toHaveAttribute('href', '/library?tab=proposals');
  });

  it('renders the feature comparison table', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('pricing-table')).toBeInTheDocument();
  });

  it('shows key features in the table', () => {
    render(<PricingPage />);
    expect(screen.getByText('Giochi privati')).toBeInTheDocument();
    expect(screen.getByText('PDF / mese')).toBeInTheDocument();
    expect(screen.getByText('Agent AI')).toBeInTheDocument();
    expect(screen.getByText('Query / giorno')).toBeInTheDocument();
    expect(screen.getByText('Salvataggio sessione')).toBeInTheDocument();
    expect(screen.getByText('Modelli AI')).toBeInTheDocument();
  });

  it('shows Consigliato badge on Premium card', () => {
    render(<PricingPage />);
    expect(screen.getByText('Consigliato')).toBeInTheDocument();
  });

  it('renders contributor note', () => {
    render(<PricingPage />);
    expect(screen.getByText(/Contributor è un ruolo/)).toBeInTheDocument();
  });

  it('renders bottom CTA linking to register', () => {
    render(<PricingPage />);
    expect(screen.getByTestId('cta-bottom')).toHaveAttribute('href', '/auth/register');
  });

  it('shows tier pricing correctly', () => {
    render(<PricingPage />);
    // Free
    expect(screen.getByText('€0')).toBeInTheDocument();
    // Premium
    expect(screen.getByText('€4.99')).toBeInTheDocument();
  });

  it('shows Free tier label in table header', () => {
    render(<PricingPage />);
    // th "Free" label
    const headers = screen.getAllByText('Free');
    expect(headers.length).toBeGreaterThan(0);
  });
});
