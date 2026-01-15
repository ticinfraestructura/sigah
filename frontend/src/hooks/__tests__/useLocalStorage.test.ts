import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Simple useLocalStorage hook for testing
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

import { useState } from 'react';

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('returns initial value when localStorage is empty', () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value from localStorage', () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify('stored'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    expect(result.current[0]).toBe('stored');
  });

  it('updates localStorage when value changes', () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
    expect(result.current[0]).toBe('new-value');
  });

  it('handles objects correctly', () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalStorage('test-key', { foo: 'bar' }));
    
    act(() => {
      result.current[1]({ foo: 'baz' });
    });
    
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({ foo: 'baz' }));
  });

  it('handles function updates', () => {
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(5));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    
    expect(result.current[0]).toBe(6);
  });
});
