import type {
  CombatantState,
  CombatantSnapshot,
  CombatLogEntry,
  CombatResult,
  StatusEffectType,
  CharacterOrigin,
} from "./types";
import type { AbilityDef } from "./abilities";
import { getAbilitiesForClass, getAbilityById } from "./abilities";
import { getBossAbilityById } from "./boss-abilities";
import { computeDerivedStats, getEffectiveStats } from "./stats";
import { calcPhysicalDamage, calcMagicDamage, rollCrit, rollDodge } from "./damage";
import {
  MAX_TURNS,
  STATUS_EFFECT_PCT,
  ARMOR_BREAK_MULT,
  RESIST_CHANCE_CAP,
  ENEMY_SKILL_USE_CHANCE,
} from "./balance";
import { hasCheatDeath, getCheatDeathChance } from "./origins";

/** Apply damage to combatant. Returns actual damage dealt. Zero is valid for buffs.
 *  Supports Sewer Shadow "Cheating Death" passive — 5% chance to survive at 1 HP. */
const applyDamage = (state: CombatantState, amount: number): { actual: number; cheatedDeath: boolean } => {
  if (amount <= 0) return { actual: 0, cheatedDeath: false };
  const actual = Math.max(1, Math.floor(amount));
  const newHp = state.currentHp - actual;

  if (newHp <= 0 && state.origin && hasCheatDeath(state.origin) && state.currentHp > 1) {
    const chance = getCheatDeathChance(state.origin);
    if (Math.random() < chance) {
      state.currentHp = 1;
      return { actual: state.currentHp - 1 + actual, cheatedDeath: true };
    }
  }

  state.currentHp = Math.max(0, newHp);
  return { actual, cheatedDeath: false };
};

const toSnapshot = (s: CombatantState): CombatantSnapshot => ({
  id: s.id,
  name: s.name,
  class: s.class,
  origin: s.origin,
  level: s.level,
  currentHp: s.currentHp,
  maxHp: s.maxHp,
  baseStats: { ...s.baseStats },
});

/** Get effective armor considering armor_break status */
const getEffectiveArmor = (state: CombatantState): number => {
  const hasArmorBreak = state.statusEffects.some((s) => s.type === "armor_break");
  if (hasArmorBreak) return Math.floor(state.armor * ARMOR_BREAK_MULT);
  return state.armor;
};

/** Get effective dodge chance considering dodge bonus buffs */
const getEffectiveDodge = (state: CombatantState): number => {
  const dodgeBuff = state.statusEffects.find((s) => s.type === "dodge_buff" as StatusEffectType);
  return state.derived.dodgeChance + (dodgeBuff?.value ?? 0);
};

const tickStatusEffects = (
  state: CombatantState,
  log: CombatLogEntry[],
  turn: number
): void => {
  const ticks: { type: StatusEffectType; damage?: number; healed?: number }[] = [];
  state.statusEffects = state.statusEffects.filter((s) => {
    s.duration--;
    if (s.type === "bleed" && s.duration >= 0) {
      const dmg = Math.max(1, Math.floor(state.maxHp * STATUS_EFFECT_PCT.bleed));
      state.currentHp = Math.max(0, state.currentHp - dmg);
      ticks.push({ type: "bleed", damage: dmg });
    }
    if (s.type === "poison" && s.duration >= 0) {
      const dmg = Math.max(1, Math.floor(state.maxHp * STATUS_EFFECT_PCT.poison));
      state.currentHp = Math.max(0, state.currentHp - dmg);
      ticks.push({ type: "poison", damage: dmg });
    }
    if (s.type === "burn" && s.duration >= 0) {
      const dmg = Math.max(1, Math.floor(state.maxHp * STATUS_EFFECT_PCT.burn));
      state.currentHp = Math.max(0, state.currentHp - dmg);
      ticks.push({ type: "burn", damage: dmg });
    }
    if (s.type === "regen" && s.duration >= 0) {
      const heal = Math.max(1, Math.floor(state.maxHp * STATUS_EFFECT_PCT.regen));
      state.currentHp = Math.min(state.maxHp, state.currentHp + heal);
      ticks.push({ type: "regen", healed: heal });
    }
    return s.duration > 0;
  });

  // Clean up expired self-buff status effects (str_buff, dodge_buff, armor_buff, resist_buff)
  // These are automatically removed by the duration filter above.

  if (ticks.length > 0 && state.currentHp > 0) {
    log.push({
      turn,
      actorId: state.id,
      targetId: state.id,
      action: "status_tick",
      statusTicks: ticks,
      message: `Effects: ${ticks.map((t) => (t.damage ? `-${t.damage}` : `+${t.healed}`)).join(", ")}`,
    });
  }
};

const tryApplyStatus = (
  target: CombatantState,
  type: StatusEffectType,
  duration: number,
  resistChance: number
): boolean => {
  if (Math.random() * 100 < resistChance) return false;
  const existing = target.statusEffects.find((s) => s.type === type);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else target.statusEffects.push({ type, duration });
  return true;
};

/** GDD: Resist_Chance_% = (END/10) + (WIS/15), Max 60% */
const getResistChance = (end: number, wis: number): number =>
  Math.min(RESIST_CHANCE_CAP, end / 10 + wis / 15);

const isStunned = (state: CombatantState): boolean =>
  state.statusEffects.some((s) => s.type === "stun");

/** Apply self-buff from ability (e.g. Battle Cry +30% STR) */
const applySelfBuff = (
  caster: CombatantState,
  ability: AbilityDef,
  log: CombatLogEntry[],
  turnNum: number
): void => {
  if (!ability.selfBuff) return;

  const buffMessages: string[] = [];

  for (const [stat, pct] of Object.entries(ability.selfBuff)) {
    if (stat === "str" || stat === "strength") {
      // Temporary STR buff stored as status effect with value
      caster.statusEffects.push({
        type: "berserk" as StatusEffectType, // reuse berserk as STR buff marker
        duration: 3,
        value: Math.floor(caster.baseStats.strength * pct),
      });
      caster.baseStats.strength += Math.floor(caster.baseStats.strength * pct);
      buffMessages.push(`+${Math.round(pct * 100)}% STR`);
    }
    if (stat === "armor") {
      caster.statusEffects.push({
        type: "regen" as StatusEffectType, // armor buff marker — separate from heal regen
        duration: 3,
        value: Math.floor(caster.armor * pct),
      });
      caster.armor += Math.floor(caster.armor * pct);
      buffMessages.push(`+${Math.round(pct * 100)}% Armor`);
    }
    if (stat === "resist") {
      // Resist buff — reduces incoming status chance. Stored as status.
      caster.statusEffects.push({
        type: "weaken" as StatusEffectType, // reuse weaken slot for resist buff on self
        duration: 3,
        value: Math.floor(pct * 100), // store as percentage
      });
      buffMessages.push(`+${Math.round(pct * 100)}% Resistance`);
    }
  }

  if (ability.dodgeBonus) {
    const turns = ability.dodgeBonusTurns ?? 2;
    caster.statusEffects.push({
      type: "blind" as StatusEffectType, // reuse blind slot as dodge buff on self
      duration: turns,
      value: ability.dodgeBonus,
    });
    // Temporarily increase dodge
    caster.derived = {
      ...caster.derived,
      dodgeChance: Math.min(40, caster.derived.dodgeChance + ability.dodgeBonus),
    };
    buffMessages.push(`+${ability.dodgeBonus}% Dodge for ${turns} turns`);
  }

  log.push({
    turn: turnNum,
    actorId: caster.id,
    targetId: caster.id,
    action: ability.id,
    message: `${caster.name} uses ${ability.name}: ${buffMessages.join(", ")}.`,
  });
};

/** Resolve ability by id: checks class abilities first, then boss abilities. */
const resolveAbility = (
  attacker: CombatantState,
  actionId: string,
): AbilityDef | undefined => {
  const classAbility = getAbilityById(attacker.class, actionId);
  if (classAbility) return classAbility;
  return getBossAbilityById(actionId);
};

/** Pick an action for the enemy (boss). ~60% chance to use a skill if available. */
const getEnemyAction = (enemy: CombatantState): "basic" | string => {
  const ids = enemy.bossAbilityIds;
  if (!ids || ids.length === 0) return "basic";

  const available = ids.filter((id) => (enemy.abilityCooldowns[id] ?? 0) <= 0);
  if (available.length > 0 && Math.random() < ENEMY_SKILL_USE_CHANCE) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return "basic";
};

export const runCombat = (
  player: CombatantState,
  enemy: CombatantState,
  playerChoices: ("basic" | string)[] = []
): CombatResult => {
  const log: CombatLogEntry[] = [];
  let turn = 0;

  // Track first strike for abilities like Backstab
  player.isFirstStrike = true;
  enemy.isFirstStrike = true;

  /** Stamp HP on a specific log entry (or the last one if not given) */
  const stampHp = (actor: CombatantState, target: CombatantState, entry?: CombatLogEntry): void => {
    const e = entry ?? log[log.length - 1];
    if (!e) return;
    e.actorHpAfter = actor.currentHp;
    e.targetHpAfter = target.currentHp;
  };

  /** Stamp HP only on entries added since `sinceLength` */
  const stampHpSince = (sinceLength: number, actor: CombatantState, target: CombatantState): void => {
    for (let i = sinceLength; i < log.length; i++) {
      stampHp(actor, target, log[i]);
    }
  };

  let choiceIndex = 0;
  const getPlayerAction = (): "basic" | string => {
    if (choiceIndex < playerChoices.length) {
      return playerChoices[choiceIndex++] as "basic" | string;
    }
    const abilities = getAbilitiesForClass(player.class, player.level);
    const available = abilities.filter(
      (a) => (player.abilityCooldowns[a.id] ?? 0) <= 0
    );
    if (available.length > 0 && Math.random() < 0.5) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return pick.id;
    }
    return "basic";
  };

  const resolveAttack = (
    attacker: CombatantState,
    target: CombatantState,
    action: "basic" | string,
    turnNum: number
  ): void => {
    const isBasic = action === "basic";
    let skillMult = 1;
    let spellMult = 0;
    let ability: AbilityDef | undefined;
    let critBonus = 0;
    let armorBreakApplied = 0;
    let statusToApply: { chance: number; duration: number; type: string } | undefined;

    let effectiveAction: string = action;

    if (!isBasic) {
      ability = resolveAbility(attacker, action);
      if (ability && (attacker.abilityCooldowns[ability.id] ?? 0) <= 0) {
        // FIX: firstStrikeOnly — ability only works if this is attacker's first strike
        if (ability.firstStrikeOnly && !attacker.isFirstStrike) {
          // Fallback to basic attack
          skillMult = 1;
          ability = undefined;
          effectiveAction = "basic";
        } else if (ability.type === "buff") {
          // FIX: Buff abilities don't deal damage — apply self buff and return
          attacker.abilityCooldowns[ability.id] = ability.cooldown;
          applySelfBuff(attacker, ability, log, turnNum);
          stampHp(attacker, target);
          return;
        } else {
          if (ability.type === "physical") skillMult = ability.multiplier;
          if (ability.type === "magic") spellMult = ability.multiplier;
          critBonus = ability.critBonus ?? 0;
          ability.armorBreak && (armorBreakApplied = ability.armorBreak);
          ability.status && (statusToApply = ability.status);
          attacker.abilityCooldowns[ability.id] = ability.cooldown;
        }
      } else {
        // Ability on cooldown — fallback to basic
        skillMult = 1;
        effectiveAction = "basic";
      }
    }

    // Use effective dodge (includes dodge buff)
    const dodgeChance = getEffectiveDodge(target);
    const didDodge = rollDodge(dodgeChance);
    if (didDodge) {
      log.push({
        turn: turnNum,
        actorId: attacker.id,
        targetId: target.id,
        action: effectiveAction,
        dodge: true,
        message: "DODGE!",
      });
      stampHp(attacker, target);
      // Mark first strike consumed
      attacker.isFirstStrike = false;
      return;
    }

    let damage = 0;
    const isPhysical = !spellMult || spellMult === 0;
    const critChance = Math.min(50, attacker.derived.critChance + critBonus);
    const isCrit = rollCrit(critChance);

    // Use effective armor (considering armor_break)
    const effectiveArmor = getEffectiveArmor(target);

    if (isPhysical && skillMult > 0) {
      damage = calcPhysicalDamage({
        attackerStr: attacker.baseStats.strength,
        defenderEnd: target.baseStats.endurance,
        defenderArmor: effectiveArmor,
        skillMultiplier: skillMult,
        isCrit,
        critDamageMult: attacker.derived.critDamageMult,
      });
    } else if (spellMult > 0) {
      damage = calcMagicDamage({
        attackerInt: attacker.baseStats.intelligence,
        defenderWis: target.baseStats.wisdom,
        spellMultiplier: spellMult,
        isCrit,
        critDamageMult: attacker.derived.critDamageMult,
      });
    }

    if (ability?.hits) damage *= ability.hits;

    // FIX: Execute threshold — only apply extra multiplier if NOT already a crit (no double crit)
    if (ability?.executeThreshold && target.currentHp / target.maxHp < ability.executeThreshold) {
      if (!isCrit) {
        damage = Math.floor(damage * attacker.derived.critDamageMult);
      }
      // If already crit, execute doesn't stack — damage already includes crit mult
    }

    const { actual, cheatedDeath } = applyDamage(target, damage);

    let message = `${attacker.name} ${effectiveAction === "basic" ? "attacks" : effectiveAction}: ${actual} damage${isCrit ? " (crit)" : ""}.`;
    if (cheatedDeath) {
      message += ` ${target.name} cheated death! (1 HP)`;
    }

    log.push({
      turn: turnNum,
      actorId: attacker.id,
      targetId: target.id,
      action: effectiveAction,
      damage: actual,
      crit: isCrit,
      message,
    });
    stampHp(attacker, target);

    // Mark first strike consumed after first attack
    attacker.isFirstStrike = false;

    if (armorBreakApplied > 0) {
      const reduction = target.armor * armorBreakApplied;
      target.armor = Math.max(0, Math.floor(target.armor - reduction));
      // FIX: Pass resist chance directly (higher resist = more chance to resist)
      tryApplyStatus(
        target,
        "armor_break",
        2,
        getResistChance(target.baseStats.endurance, target.baseStats.wisdom)
      );
    }
    if (statusToApply && Math.random() < statusToApply.chance) {
      // FIX: Pass resist chance directly (higher resist = more chance to resist)
      tryApplyStatus(
        target,
        statusToApply.type as StatusEffectType,
        statusToApply.duration,
        getResistChance(target.baseStats.endurance, target.baseStats.wisdom)
      );
    }
  };

  const decrementCooldowns = (state: CombatantState): void => {
    for (const key of Object.keys(state.abilityCooldowns)) {
      state.abilityCooldowns[key] = Math.max(0, state.abilityCooldowns[key] - 1);
    }
  };

  while (turn < MAX_TURNS && player.currentHp > 0 && enemy.currentHp > 0) {
    turn++;
    const lenBeforePlayerTick = log.length;
    tickStatusEffects(player, log, turn);
    stampHpSince(lenBeforePlayerTick, player, enemy);
    const lenBeforeEnemyTick = log.length;
    tickStatusEffects(enemy, log, turn);
    stampHpSince(lenBeforeEnemyTick, enemy, player);
    if (player.currentHp <= 0 || enemy.currentHp <= 0) break;

    const playerFirst = player.baseStats.agility >= enemy.baseStats.agility;
    const first = playerFirst ? player : enemy;
    const second = playerFirst ? enemy : player;

    decrementCooldowns(player);
    decrementCooldowns(enemy);

    if (!isStunned(first)) {
      const action = first.id === player.id ? getPlayerAction() : getEnemyAction(first);
      resolveAttack(first, second, action, turn);
    } else {
      first.statusEffects = first.statusEffects.filter((s) => s.type !== "stun" || s.duration > 1);
      log.push({
        turn,
        actorId: first.id,
        targetId: first.id,
        action: "stun",
        message: `${first.name} is stunned.`,
      });
      stampHp(first, second);
    }
    if (second.currentHp <= 0) break;

    if (!isStunned(second)) {
      const action = second.id === player.id ? getPlayerAction() : getEnemyAction(second);
      resolveAttack(second, first, action, turn);
    } else {
      second.statusEffects = second.statusEffects.filter((s) => s.type !== "stun" || s.duration > 1);
      log.push({
        turn,
        actorId: second.id,
        targetId: second.id,
        action: "stun",
        message: `${second.name} is stunned.`,
      });
      stampHp(second, first);
    }
  }

  let winnerId: string | null = null;
  let loserId: string | null = null;
  let draw = false;
  if (player.currentHp <= 0 && enemy.currentHp <= 0) {
    draw = true;
  } else if (player.currentHp <= 0) {
    winnerId = enemy.id;
    loserId = player.id;
  } else if (enemy.currentHp <= 0) {
    winnerId = player.id;
    loserId = enemy.id;
  } else {
    const playerHpPct = player.currentHp / player.maxHp;
    const enemyHpPct = enemy.currentHp / enemy.maxHp;
    if (playerHpPct > enemyHpPct) {
      winnerId = player.id;
      loserId = enemy.id;
    } else if (enemyHpPct > playerHpPct) {
      winnerId = enemy.id;
      loserId = player.id;
    } else {
      draw = true;
    }
  }

  return {
    winnerId,
    loserId,
    draw,
    turns: turn,
    log,
    playerSnapshot: toSnapshot(player),
    enemySnapshot: toSnapshot(enemy),
  };
};

/** Equipment bonuses aggregated from all equipped items */
export type EquipmentBonuses = {
  ATK?: number;
  DEF?: number;
  HP?: number;
  CRIT?: number;
  SPEED?: number;
  ARMOR?: number;
};

/** Build CombatantState from character-like object and optional equipment bonuses */
export const buildCombatantState = (params: {
  id: string;
  name: string;
  class: "warrior" | "rogue" | "mage" | "tank";
  origin?: CharacterOrigin;
  level: number;
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
  armor?: number;
  /** Aggregated equipment stats (ATK, DEF, HP, CRIT, SPEED, ARMOR) */
  equipmentBonuses?: EquipmentBonuses;
}): CombatantState => {
  const {
    id,
    name,
    class: cls,
    origin,
    level,
    strength,
    agility,
    vitality,
    endurance,
    intelligence,
    wisdom,
    luck,
    charisma,
    armor = 0,
    equipmentBonuses,
  } = params;

  const eqATK = equipmentBonuses?.ATK ?? 0;
  const eqDEF = equipmentBonuses?.DEF ?? 0;
  const eqHP = equipmentBonuses?.HP ?? 0;
  const eqCRIT = equipmentBonuses?.CRIT ?? 0;
  const eqARMOR = equipmentBonuses?.ARMOR ?? 0;

  // ATK adds to effective strength, DEF adds to effective endurance
  const baseStats = getEffectiveStats(
    {
      strength: strength + eqATK,
      agility,
      vitality,
      endurance: endurance + eqDEF,
      intelligence,
      wisdom,
      luck,
      charisma,
    },
    origin
  );

  const totalArmor = armor + eqARMOR;
  const derived = computeDerivedStats(baseStats, totalArmor, 0, eqCRIT);
  const maxHp = derived.maxHp + eqHP;
  return {
    id,
    name,
    class: cls,
    origin,
    level,
    baseStats,
    derived,
    currentHp: maxHp,
    maxHp,
    armor: totalArmor,
    magicResist: derived.magicResist,
    statusEffects: [],
    abilityCooldowns: {},
  };
};
