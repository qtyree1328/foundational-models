import { useEffect, useRef } from 'react';

export function useInView() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const el = ref.current;
    if (el) {
      el.querySelectorAll('.fade-in').forEach((child) => observer.observe(child));
    }
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function useSectionInView(callback?: (id: string) => void) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && callback) {
            const id = entry.target.getAttribute('data-section');
            if (id) callback(id);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [callback]);
}
