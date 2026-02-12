import { prisma } from "@/lib/db";

const DEFAULT_SEASON_NUMBER = 1;

export const getOrCreateCurrentSeason = async (): Promise<{ number: number }> => {
  const now = new Date();
  let season = await prisma.season.findFirst({
    where: { startAt: { lte: now }, endAt: { gte: now } },
    orderBy: { number: "desc" },
  });
  if (season) return { number: season.number };
  season = await prisma.season.findFirst({
    orderBy: { number: "desc" },
  });
  const nextNum = season ? season.number + 1 : DEFAULT_SEASON_NUMBER;
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  await prisma.season.create({
    data: { number: nextNum, startAt: start, endAt: end, theme: "Proving Grounds" },
  });
  return { number: nextNum };
};

export const getCurrentSeasonNumber = async (): Promise<number> => {
  const { number } = await getOrCreateCurrentSeason();
  return number;
};
