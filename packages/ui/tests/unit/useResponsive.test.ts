import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '../../src/hooks/useResponsive';

describe('useResponsive Hook', () => {
  it('returns responsive state', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current).toHaveProperty('breakpoint');
    expect(result.current).toHaveProperty('dimensions');
    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isTablet');
    expect(result.current).toHaveProperty('isDesktop');
    expect(result.current).toHaveProperty('isTouch');
  });

  it('detects desktop breakpoint for large screens', () => {
    // Mock window.innerWidth
    global.innerWidth = 1280;
    global.dispatchEvent(new Event('resize'));
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('provides dimension information', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.dimensions).toHaveProperty('width');
    expect(result.current.dimensions).toHaveProperty('height');
    expect(typeof result.current.dimensions.width).toBe('number');
    expect(typeof result.current.dimensions.height).toBe('number');
  });
});
