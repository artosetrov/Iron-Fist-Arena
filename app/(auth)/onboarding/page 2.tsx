"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ALL_ORIGINS,
  ORIGIN_DEFS,
  ORIGIN_GRADIENT,
  ORIGIN_BORDER,
  ORIGIN_ACCENT,
  type CharacterOrigin,
} from "@/lib/game/origins";
import {
  PROLOGUE_COMMON,
  ORIGIN_LORE,
  ONBOARDING_COPY,
} from "@/lib/game/lore";
import { GameButton } from "@/app/components/ui";

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */

const ORIGIN_IMAGE: Record<CharacterOrigin, string> = {
  human: "/images/origins/Avatar/origin-human_avatar_1.png",
  orc: "/images/origins/Avatar/origin-orc_avatar_1.png",
  skeleton: "/images/origins/Avatar/origin-skeleton_avatar_1.png",
  demon: "/images/origins/Avatar/origin-demon_avatar_1.png",
  dogfolk: "/images/origins/Avatar/origin-dogfolk_avatar_1.png",
};

type OnboardingStep = "race" | "prologue";

/* ═══════════════════════════════════════════════════════════════════
   Race Selection Card
   ═══════════════════════════════════════════════════════════════════ */

const RaceCard = ({
  origin,
  selected,
  onSelect,
}: {
  origin: CharacterOrigin;
  selected: boolean;
  onSelect: (o: CharacterOrigin) => void;
}) => {
  const def = ORIGIN_DEFS[origin];
  const lore = ORIGIN_LORE[origin];

  return (
    <button
      type="button"
      onClick={() => onSelect(origin)}
      className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-300
        ${
          selected
            ? `bg-gradient-to-b ${ORIGIN_GRADIENT[origin]} ${ORIGIN_BORDER[origin]?.split(" ")[0]} shadow-xl shadow-black/30 scale-[1.03]`
            : "border-slate-700/50 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/80 hover:scale-[1.01]"
        }
      `}
      aria-label={`Select origin ${def.label}`}
      aria-pressed={selected}
      tabIndex={0}
    >
      {/* Avatar */}
      <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-slate-700/60 bg-slate-800 shadow-inner sm:h-24 sm:w-24">
        <Image
          src={ORIGIN_IMAGE[origin]}
          alt={def.label}
          fill
          className="object-cover object-top transition-transform duration-300 group-hover:scale-110"
          sizes="96px"
        />
      </div>

      {/* Name + icon */}
      <div className="text-center">
        <p
          className={`font-display text-lg font-bold uppercase tracking-wider ${
            selected ? ORIGIN_ACCENT[origin] : "text-slate-200"
          }`}
        >
          {def.icon} {def.label}
        </p>
        <p className="mt-1 text-xs text-slate-400 italic leading-snug">
          &ldquo;{lore.tagline}&rdquo;
        </p>
      </div>

      {/* Bonus badge */}
      <div className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {def.bonusDescription}
        </p>
      </div>

      {/* Checkmark */}
      {selected && (
        <span className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-black shadow-lg">
          ✓
        </span>
      )}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Prologue Slide Component
   ═══════════════════════════════════════════════════════════════════ */

const PrologueSlide = ({
  title,
  text,
  bgImage,
  slideIndex,
  totalSlides,
  onNext,
  onSkip,
}: {
  title: string;
  text: string;
  bgImage?: string;
  slideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onSkip: () => void;
}) => {
  const isLast = slideIndex === totalSlides - 1;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-end overflow-hidden bg-slate-950"
      role="article"
      aria-label={`Prologue slide ${slideIndex + 1} of ${totalSlides}`}
    >
      {/* Background image or gradient fallback */}
      {bgImage ? (
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover object-center opacity-60"
          priority={slideIndex === 0}
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-slate-950 to-slate-950" />
      )}

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-4 top-4 z-30 rounded-lg border border-slate-700/50 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm transition-all hover:border-slate-600 hover:text-slate-300"
        aria-label="Skip prologue"
        tabIndex={0}
      >
        {ONBOARDING_COPY.prologueSkipLabel}
      </button>

      {/* Content area */}
      <div className="relative z-20 flex w-full max-w-2xl flex-col items-center px-6 pb-12">
        {/* Progress dots */}
        <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={slideIndex + 1} aria-valuemax={totalSlides}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? "w-8 bg-amber-500"
                  : i < slideIndex
                    ? "w-4 bg-amber-500/40"
                    : "w-4 bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="mb-4 text-center font-display text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {title}
        </h2>

        {/* Text */}
        <p className="mb-8 text-center text-sm leading-relaxed text-slate-300 sm:text-base animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {text}
        </p>

        {/* Next / Enter button */}
        <GameButton
          size="lg"
          onClick={onNext}
          className="min-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
          aria-label={isLast ? "Continue" : ONBOARDING_COPY.prologueNextLabel}
          tabIndex={0}
        >
          {isLast ? "Continue" : ONBOARDING_COPY.prologueNextLabel}
        </GameButton>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Main Onboarding Page
   ═══════════════════════════════════════════════════════════════════ */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("race");
  const [selectedOrigin, setSelectedOrigin] = useState<CharacterOrigin | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  /* Build the full slide list: common prologue + 1 race-unique slide */
  const allSlides = useMemo(() => {
    if (!selectedOrigin) return PROLOGUE_COMMON;
    const raceSlide = ORIGIN_LORE[selectedOrigin].prologueSlide;
    return [...PROLOGUE_COMMON, raceSlide];
  }, [selectedOrigin]);

  const handleRaceContinue = useCallback(() => {
    if (!selectedOrigin) return;
    setSlideIndex(0);
    setStep("prologue");
  }, [selectedOrigin]);

  const handleFinishPrologue = useCallback(() => {
    if (!selectedOrigin) return;
    router.push(`/character?origin=${selectedOrigin}&fromOnboarding=true`);
  }, [selectedOrigin, router]);

  const handleNextSlide = useCallback(() => {
    if (slideIndex < allSlides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      handleFinishPrologue();
    }
  }, [slideIndex, allSlides.length, handleFinishPrologue]);

  const handleSkipPrologue = useCallback(() => {
    handleFinishPrologue();
  }, [handleFinishPrologue]);

  /* ── Step: Race Selection ── */
  if (step === "race") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-4xl">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
              {ONBOARDING_COPY.raceSelectionTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {ONBOARDING_COPY.raceSelectionSubtitle}
            </p>
          </header>

          {/* Race grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ALL_ORIGINS.map((origin) => (
              <RaceCard
                key={origin}
                origin={origin}
                selected={selectedOrigin === origin}
                onSelect={setSelectedOrigin}
              />
            ))}
          </div>

          {/* Selected race description */}
          {selectedOrigin && (
            <div className="mx-auto mb-8 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 text-center">
                <p className={`text-sm font-medium leading-relaxed ${ORIGIN_ACCENT[selectedOrigin]}`}>
                  {ORIGIN_LORE[selectedOrigin].loreDescription}
                </p>
              </div>
            </div>
          )}

          {/* Continue button */}
          <div className="flex justify-center">
            <GameButton
              size="lg"
              disabled={!selectedOrigin}
              onClick={handleRaceContinue}
              className="min-w-[200px]"
              aria-label="Continue to prologue"
              tabIndex={0}
            >
              Continue
            </GameButton>
          </div>
        </div>
      </main>
    );
  }

  /* ── Step: Prologue Slides ── */
  const currentSlide = allSlides[slideIndex];

  return (
    <PrologueSlide
      key={currentSlide.id}
      title={currentSlide.title}
      text={currentSlide.text}
      bgImage={currentSlide.bgImage}
      slideIndex={slideIndex}
      totalSlides={allSlides.length}
      onNext={handleNextSlide}
      onSkip={handleSkipPrologue}
    />
  );
}
