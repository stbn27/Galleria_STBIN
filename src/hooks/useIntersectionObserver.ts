import { useEffect, useState, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    if (!window.IntersectionObserver) {
      // Fallback for older browsers
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      const isElementIntersecting = entry.isIntersecting;
      
      if (options.freezeOnceVisible && isElementIntersecting) {
        setIsIntersecting(true);
        observer.unobserve(target);
      } else {
        setIsIntersecting(isElementIntersecting);
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [ref, options.rootMargin, options.threshold, options.root, options.freezeOnceVisible]);

  return isIntersecting;
}
