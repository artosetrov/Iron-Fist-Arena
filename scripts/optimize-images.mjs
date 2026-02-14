#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Рекурсивно обходит public/images/, ресайзит и сжимает PNG
 * по категориям (см. RULES). Пропускает дубликаты (* 2.png).
 *
 * Использование:
 *   node scripts/optimize-images.mjs          — оптимизация
 *   node scripts/optimize-images.mjs --dry    — только отчёт без записи
 */

import sharp from "sharp";
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";

/* ── Конфигурация ── */

const IMAGES_DIR = "public/images";

/**
 * Правила ресайза. Проверяются сверху вниз, первый совпавший — применяется.
 * test() получает relative path от IMAGES_DIR.
 */
const RULES = [
  /* Фоны (большие локации) */
  { test: (p) => /hub-bg\.png$/i.test(p), w: 1920, h: 1080 },
  { test: (p) => /arena-background\.png$/i.test(p), w: 1920, h: 1080 },
  { test: (p) => /Stray City\.png$/i.test(p), w: 1920, h: 1080 },
  { test: (p) => /tavern-interior\.png$/i.test(p), w: 1920, h: 1080 },
  { test: (p) => /inventory-bag-bg/i.test(p), w: 1920, h: 1080 },
  { test: (p) => p.startsWith("ui/onboarding/"), w: 1920, h: 1080 },

  /* Иконки */
  { test: (p) => p.startsWith("ui/icons/"), w: 128, h: 128 },
  { test: (p) => p.startsWith("ui/slots/"), w: 128, h: 128 },

  /* Combat VFX */
  { test: (p) => p.startsWith("combat/"), w: 256, h: 256 },

  /* Предметы */
  { test: (p) => p.startsWith("items/"), w: 128, h: 128 },

  /* Боссы, классы, расы */
  { test: (p) => p.startsWith("bosses/"), w: 512, h: 512 },
  { test: (p) => p.startsWith("classes/"), w: 512, h: 512 },
  { test: (p) => p.startsWith("origins/"), w: 512, h: 512 },

  /* Подземелья */
  { test: (p) => p.startsWith("dungeons/"), w: 640, h: 480 },

  /* Здания и пины */
  { test: (p) => p.startsWith("buildings/"), w: 256, h: 256 },

  /* Минигры пины и ассеты */
  { test: (p) => p.startsWith("minigames/pins/"), w: 256, h: 256 },
  { test: (p) => p.startsWith("minigames/"), w: 256, h: 256 },

  /* UI остальное (logo, 404, wrong, sidebar, placeholder) */
  { test: (p) => p.startsWith("ui/sidebar/"), w: 256, h: 256 },
  { test: (p) => p.startsWith("ui/"), w: 512, h: 512 },
];

const DEFAULT_RULE = { w: 512, h: 512 };

/* ── Helpers ── */

const isDryRun = process.argv.includes("--dry");

const isDuplicate = (name) => / 2\./i.test(name);

const getRule = (relPath) => {
  for (const rule of RULES) {
    if (rule.test(relPath)) return rule;
  }
  return DEFAULT_RULE;
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/* ── Рекурсивный обход ── */

const collectFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full)));
    } else if (extname(entry.name).toLowerCase() === ".png") {
      files.push(full);
    }
  }
  return files;
};

/* ── Main ── */

const main = async () => {
  console.log(isDryRun ? "\n=== DRY RUN (без записи) ===" : "\n=== Оптимизация изображений ===");
  console.log(`Директория: ${IMAGES_DIR}\n`);

  const allFiles = await collectFiles(IMAGES_DIR);
  const toProcess = allFiles.filter((f) => !isDuplicate(basename(f)));
  const skippedDupes = allFiles.length - toProcess.length;

  console.log(`Найдено: ${allFiles.length} PNG (${skippedDupes} дубликатов пропущено)\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skippedSmaller = 0;
  let errors = 0;

  for (const filePath of toProcess) {
    const relPath = relative(IMAGES_DIR, filePath);
    const rule = getRule(relPath);

    try {
      const originalStat = await stat(filePath);
      const originalSize = originalStat.size;
      totalBefore += originalSize;

      const metadata = await sharp(filePath).metadata();
      const { width: origW, height: origH } = metadata;

      /* Если изображение уже меньше или равно целевому — только сжатие */
      const needsResize = origW > rule.w || origH > rule.h;

      const tmpPath = filePath + ".tmp";

      let pipeline = sharp(filePath);

      if (needsResize) {
        pipeline = pipeline.resize(rule.w, rule.h, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: metadata.hasAlpha ? false : true,
        quality: 80,
      });

      if (!isDryRun) {
        await pipeline.toFile(tmpPath);
        const newStat = await stat(tmpPath);

        /* Если оптимизированная версия больше оригинала — оставляем оригинал */
        if (newStat.size >= originalSize) {
          await unlink(tmpPath);
          totalAfter += originalSize;
          skippedSmaller++;
          continue;
        }

        await unlink(filePath);
        await rename(tmpPath, filePath);
        totalAfter += newStat.size;

        const saved = ((1 - newStat.size / originalSize) * 100).toFixed(1);
        console.log(
          `✓ ${relPath}  ${origW}×${origH} → ${rule.w}×${rule.h}  ` +
            `${formatBytes(originalSize)} → ${formatBytes(newStat.size)} (-${saved}%)`
        );
      } else {
        totalAfter += originalSize; // в dry run не знаем точный размер
        console.log(
          `  ${relPath}  ${origW}×${origH} → ${rule.w}×${rule.h}  ${formatBytes(originalSize)}`
        );
      }

      processed++;
    } catch (err) {
      errors++;
      console.error(`✗ ${relPath}: ${err.message}`);
    }
  }

  console.log("\n─────────────────────────────────────");
  console.log(`Обработано:  ${processed}`);
  console.log(`Пропущено (уже оптимальны): ${skippedSmaller}`);
  console.log(`Ошибок:      ${errors}`);
  console.log(`До:          ${formatBytes(totalBefore)}`);
  if (!isDryRun) {
    console.log(`После:       ${formatBytes(totalAfter)}`);
    console.log(`Экономия:    ${formatBytes(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  }
  console.log("─────────────────────────────────────\n");
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
