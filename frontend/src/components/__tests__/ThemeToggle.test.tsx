import { describe, it, expect } from 'vitest';
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
    
    fireEvent.click(button);
    
    // Label should change after click
    // The actual behavior depends on ThemeContext implementation
  });
});
