'use client';

import { useEffect, useRef, useState } from 'react';

interface VirtualListProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight?: number;
  children: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualList<T>({ 
  data, 
  itemHeight = 40, 
  containerHeight = 600,
  children,
  className 
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = data.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    data.length,
    startIndex + Math.ceil(containerHeight / itemHeight) + 1
  );

  const visibleData = data.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY }}>
          {visibleData.map((item, index) => (
            <div 
              key={index} 
              style={{ height: itemHeight }}
            >
              {children(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
