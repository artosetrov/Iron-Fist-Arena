/**
 * Runs a "fly item to sidebar" animation: clones an image from sourceRect,
 * animates it to the sidebar avatar block, then calls onComplete.
 * Used by the shop when buying items/consumables.
 */

const FLY_TARGET_SELECTOR = '[data-fly-target="sidebar-avatar"]';
const DURATION_MS = 500;
const END_SCALE = 0.25;

const getTargetRect = (): DOMRect => {
  const el = document.querySelector(FLY_TARGET_SELECTOR);
  if (el) return el.getBoundingClientRect();
  return new DOMRect(24, 100, 96, 96);
};

export const flyItemToSidebar = (
  sourceRect: DOMRect,
  imageSrc: string,
  onComplete: () => void
): void => {
  const targetRect = getTargetRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const startX = sourceRect.left;
  const startY = sourceRect.top;
  const endX = targetCenterX - (sourceRect.width * END_SCALE) / 2;
  const endY = targetCenterY - (sourceRect.height * END_SCALE) / 2;

  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.left = "0";
  wrap.style.top = "0";
  wrap.style.width = `${sourceRect.width}px`;
  wrap.style.height = `${sourceRect.height}px`;
  wrap.style.pointerEvents = "none";
  wrap.style.zIndex = "9999";
  wrap.style.transform = `translate(${startX}px,${startY}px)`;
  wrap.style.transition = `transform ${DURATION_MS}ms ease-out`;

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "";
  img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block";
  wrap.appendChild(img);

  document.body.appendChild(wrap);

  let completed = false;
  const onEnd = () => {
    if (completed) return;
    completed = true;
    wrap.removeEventListener("transitionend", onEnd);
    wrap.remove();
    onComplete();
  };

  wrap.addEventListener("transitionend", onEnd);
  setTimeout(onEnd, DURATION_MS + 150);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.style.transform = `translate(${endX}px,${endY}px) scale(${END_SCALE})`;
    });
  });
};
