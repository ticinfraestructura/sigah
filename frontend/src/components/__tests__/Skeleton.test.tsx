import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonDashboard } from '../ui/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('renders with circular variant', () => {
      const { container } = render(<Skeleton variant="circular" />);
      const skeleton = container.firstChild as HTMLElement;
      
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders with custom dimensions', () => {
      const { container } = render(<Skeleton width={100} height={50} />);
      const skeleton = container.firstChild as HTMLElement;
      
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
    });

    it('has aria-hidden for accessibility', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonText', () => {
    it('renders multiple lines', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      
      expect(skeletons).toHaveLength(3);
    });

    it('renders default 3 lines', () => {
      const { container } = render(<SkeletonText />);
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('SkeletonCard', () => {
    it('renders card skeleton', () => {
      const { container } = render(<SkeletonCard />);
      
      // Should have avatar circle and text lines
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('SkeletonTable', () => {
    it('renders table with correct rows and columns', () => {
      const { container } = render(<SkeletonTable rows={3} columns={4} />);
      
      // Header + 3 rows = 4 sections
      const rows = container.querySelectorAll('.flex.gap-4');
      expect(rows.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SkeletonDashboard', () => {
    it('renders dashboard skeleton', () => {
      const { container } = render(<SkeletonDashboard />);
      
      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
