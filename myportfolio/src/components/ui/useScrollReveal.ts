"use client";
import type React from "react";
import { useEffect } from "react";

/**
 * Scroll reveals driven by CSS instead of per-frame JavaScript.
 *
 * Elements carry `data-reveal` (start hidden, see globals.css). One shared IntersectionObserver
 * flags each with `data-revealed` the first time it scrolls into view, which starts a plain CSS
 * animation of opacity/translate. Those run on the compositor, so they stay smooth while the
 * page is scrolled fast, hydrating, or busy decoding images — which framer-motion's `whileInView`
 * (and its animated blur filter) did not on phones.
 *
 * `data-revealed` is set imperatively and never rendered by React, so re-renders can't reset it.
 */

type RevealVariant = "rise" | "fade";

/** Spread onto any element: `<div {...reveal(0.15)} />`. Merge `style` yourself if the element has one. */
export const reveal = (delay = 0, variant: RevealVariant = "rise") =>
  ({
    "data-reveal": variant,
    style: { ["--reveal-delay" as string]: `${delay}s` } as React.CSSProperties,
  }) as const;

const REVEALED = "data-revealed";

export function useScrollReveal() {
  useEffect(() => {
    const pending = new Set<HTMLElement>();

    const show = (el: HTMLElement) => {
      el.setAttribute(REVEALED, "");
      pending.delete(el);
      observer.unobserve(el);
    };

    const track = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(`[data-reveal]:not([${REVEALED}])`).forEach((el) => {
        if (pending.has(el)) return;
        pending.add(el);
        observer.observe(el);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(entry.target as HTMLElement);
        }
        // A fast fling can carry an element from below the fold to above it between two checks,
        // so it never "intersects": reveal anything that is already behind us.
        pending.forEach((el) => {
          if (!el.isConnected) {
            pending.delete(el);
            observer.unobserve(el);
          } else if (el.getBoundingClientRect().bottom < 0) {
            show(el);
          }
        });
      },
      // Start once the element's top is ~10% into the viewport (works for very tall blocks too,
      // unlike an area-ratio threshold that a tall list can never reach on a short phone screen)
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    track(document);

    // Content rendered later (e.g. the GitHub cards once the API answers) joins in automatically
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches("[data-reveal]") && !node.hasAttribute(REVEALED) && !pending.has(node)) {
            pending.add(node);
            observer.observe(node);
          }
          track(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);
}
