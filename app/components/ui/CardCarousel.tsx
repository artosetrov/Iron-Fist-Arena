"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* ── Types ── */

type CardCarouselProps = {
  children: ReactNode;
  /** Extra classes on the outer wrapper (the one with `relative w-full`) */
  className?: string;
  /** CSS selector used to measure a single card width for scroll-by-one.
   *  Defaults to `.hero-card-container--default`. */
  cardSelector?: string;
  /** Gap between cards in px — used for scroll offset calc. Defaults to 24. */
  gap?: number;
  /** aria-labels for the nav arrows */
  ariaLabelPrev?: string;
  ariaLabelNext?: string;
};

const checkOverflow = (el: HTMLDivElement | null): boolean => {
  if (!el) return true;
  return el.scrollWidth > el.clientWidth;
};

/* ── Component ── */

const CardCarousel = ({
  children,
  className,
  cardSelector = ".hero-card-container--default",
  gap = 24,
  ariaLabelPrev = "Previous",
  ariaLabelNext = "Next",
}: CardCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => setHasOverflow(checkOverflow(el));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const handleScroll = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>(cardSelector);
      if (!card) return;
      const scrollAmount = card.offsetWidth + gap;
      el.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    },
    [cardSelector, gap],
  );

  return (
    <div className="flex items-center justify-center">
      <div className={`relative ${className ?? "w-full"}`}>
        {hasOverflow && (
          <>
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label={ariaLabelPrev}
              className="carousel-nav-btn left-0"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label={ariaLabelNext}
              className="carousel-nav-btn right-0"
            >
              ›
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className={hasOverflow ? "card-carousel" : "card-carousel card-carousel--no-overflow"}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardCarousel;
