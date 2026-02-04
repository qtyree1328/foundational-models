import { useEffect, useRef } from 'react';

export function useInView() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    // Observe all current .fade-in elements
    const observeAll = () => {
      el.querySelectorAll('.fade-in:not(.visible)').forEach((child) => observer.observe(child));
    };
    observeAll();

    // Watch for dynamically added .fade-in elements (lazy components, conditional renders)
    const mutation = new MutationObserver(() => observeAll());
    mutation.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
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
