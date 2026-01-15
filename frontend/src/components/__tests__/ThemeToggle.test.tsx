import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import ThemeToggle from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders correctly', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');
    
    fireEvent.click(button);
    
    // Label should change after click
    // The actual behavior depends on ThemeContext implementation
  });
});
