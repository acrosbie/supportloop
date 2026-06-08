"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type ReactElement } from "react";

// Reveals each direct child as it scrolls into view. The hidden state is injected
// at render (SSR) via className, so there's no flash — children start hidden and
// only ever transition to visible.
export default function RevealGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    Array.from(root.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<{ className?: string }>;
        return cloneElement(el, { className: `${el.props.className ?? ""} reveal-init` });
      })}
    </div>
  );
}
