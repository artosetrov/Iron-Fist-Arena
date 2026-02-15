"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import {
  PROLOGUE_COMMON,
  ORIGIN_LORE,
  ONBOARDING_COPY,
  type PrologueSlide,
} from "@/lib/game/lore";
import { ALL_ORIGINS, ORIGIN_DEFS } from "@/lib/game/origins";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

/** Derive asset key from bgImage path: /images/ui/onboarding/xxx.png → ui/onboarding/xxx */
const bgImageToAssetKey = (bgImage: string): string => {
  const withoutPrefix = bgImage.replace(/^\/images\//, "").replace(/\.(png|webp|jpg|jpeg)$/i, "");
  return withoutPrefix;
};

const SlideBlock = ({
  slide,
  isAdmin,
  index,
  prefix,
}: {
  slide: PrologueSlide;
  isAdmin: boolean;
  index: number;
  prefix: string;
}) => {
  const assetKey = slide.bgImage ? bgImageToAssetKey(slide.bgImage) : "";
  const defaultPath = slide.bgImage ?? "";

  return (
    <article className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {slide.bgImage && (
          <div className="shrink-0">
            <WikiAssetCard
              assetKey={assetKey}
              defaultPath={defaultPath}
              label={`${prefix} — ${slide.title}`}
              isAdmin={isAdmin}
              size={192}
              objectFit="cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-amber-400">
            {index + 1}. {slide.title}
          </h3>
          <p className="mt-2 text-slate-300 leading-relaxed">{slide.text}</p>
          {slide.artPrompt && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
                Art prompt (reference)
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto rounded border border-slate-700/80 bg-slate-950 p-2 text-[10px] leading-tight text-slate-500">
                {slide.artPrompt}
              </pre>
            </details>
          )}
        </div>
      </div>
    </article>
  );
};

export default function WikiOnboardingPage() {
  const { isAdmin } = useWikiAdmin();

  return (
    <PageContainer>
      <PageHeader title="Onboarding" />
      <div className="space-y-8 pb-8">
        <GameSection title="UI Copy">
          <p className="text-slate-400 mb-4">
            Onboarding UI strings: race selection, prologue buttons and labels.
          </p>
          <dl className="grid gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:grid-cols-1">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                raceSelectionTitle
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.raceSelectionTitle"
                  defaultValue={ONBOARDING_COPY.raceSelectionTitle}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                raceSelectionSubtitle
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.raceSelectionSubtitle"
                  defaultValue={ONBOARDING_COPY.raceSelectionSubtitle}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                prologueSkipLabel
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.prologueSkipLabel"
                  defaultValue={ONBOARDING_COPY.prologueSkipLabel}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                prologueNextLabel
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.prologueNextLabel"
                  defaultValue={ONBOARDING_COPY.prologueNextLabel}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                prologueTapHint
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.prologueTapHint"
                  defaultValue={ONBOARDING_COPY.prologueTapHint}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                finalSlideTitle
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.finalSlideTitle"
                  defaultValue={ONBOARDING_COPY.finalSlideTitle}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                finalSlideText (template, {"{name}"} = имя героя)
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.finalSlideText"
                  defaultValue={ONBOARDING_COPY.finalSlideText("Hero")}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                enterCityLabel
              </dt>
              <dd className="mt-0.5 text-slate-200">
                <WikiEditableText
                  textKey="onboarding.enterCityLabel"
                  defaultValue={ONBOARDING_COPY.enterCityLabel}
                  isAdmin={isAdmin}
                  as="span"
                />
              </dd>
            </div>
          </dl>
        </GameSection>

        <GameSection title="Common Prologue (3 slides)">
          <p className="text-slate-400 mb-4">
            Common prologue shown to all players: the world before, the world after, the Arena.
          </p>
          <ul className="space-y-4">
            {PROLOGUE_COMMON.map((slide, i) => (
              <li key={slide.id}>
                <SlideBlock
                  slide={slide}
                  isAdmin={isAdmin}
                  index={i}
                  prefix="Prologue"
                />
              </li>
            ))}
          </ul>
        </GameSection>

        <GameSection title="Origin Prologue Slides">
          <p className="text-slate-400 mb-4">
            One unique prologue slide per origin, shown after the common prologue.
          </p>
          <ul className="space-y-6">
            {ALL_ORIGINS.map((origin) => {
              const def = ORIGIN_DEFS[origin];
              const lore = ORIGIN_LORE[origin];
              const slide = lore.prologueSlide;
              return (
                <li key={origin}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{def.icon}</span>
                    <span className="font-display font-bold uppercase tracking-wider text-slate-200">
                      {def.label}
                    </span>
                    <span className="text-xs italic text-slate-500">&ldquo;{lore.tagline}&rdquo;</span>
                  </div>
                  <SlideBlock
                    slide={slide}
                    isAdmin={isAdmin}
                    index={0}
                    prefix={def.label}
                  />
                </li>
              );
            })}
          </ul>
        </GameSection>
      </div>
    </PageContainer>
  );
}
