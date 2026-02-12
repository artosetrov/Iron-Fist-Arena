/** GDD §6.2 - ELO: K=32, Expected = 1 / (1 + 10^((Opp - You)/400)) */

const K = 32;

export const expectedScore = (yourRating: number, oppRating: number): number => {
  return 1 / (1 + Math.pow(10, (oppRating - yourRating) / 400));
};

export const ratingChange = (
  yourRating: number,
  oppRating: number,
  actual: number
): number => {
  const expected = expectedScore(yourRating, oppRating);
  return Math.round(K * (actual - expected));
};

/** Get rank tier from rating (GDD §6.3) */
export const getRankFromRating = (rating: number): string => {
  if (rating >= 2100) return "Grandmaster";
  if (rating >= 1900) return "Master";
  if (rating >= 1700) return "Diamond";
  if (rating >= 1500) return "Platinum";
  if (rating >= 1300) return "Gold";
  if (rating >= 1100) return "Silver";
  return "Bronze";
};
