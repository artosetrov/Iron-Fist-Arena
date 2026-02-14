"use client";

import { useCallback, useRef, type ReactNode } from "react";

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
    <div className="flex flex-1 items-start">
      <div className={`relative w-full ${className ?? ""}`}>
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label={ariaLabelPrev}
          className="carousel-nav-btn left-0"
        >
          ‹
        </button>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label={ariaLabelNext}
          className="carousel-nav-btn right-0"
        >
          ›
        </button>

        {/* Scroll container */}
        <div ref={scrollRef} className="card-carousel">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardCarousel;
