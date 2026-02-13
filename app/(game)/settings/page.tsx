"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import { useDisplaySettings, useSoundSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/app/components/PageLoader";
import {
  ALL_ORIGINS,
  ORIGIN_DEFS,
  ORIGIN_GRADIENT,
  ORIGIN_BORDER,
  ORIGIN_ACCENT,
  ORIGIN_CHANGE_COST,
  type CharacterOrigin,
} from "@/lib/game/origins";

/* ────────────────── Types ────────────────── */

type TabId = "display" | "sound" | "character" | "account";

type Tab = {
  id: TabId;
  label: string;
  icon: React.ReactNode;
};

type UserInfo = {
  username: string;
  email: string;
};

/* ────────────────── Tab definitions ────────────────── */

const TABS: Tab[] = [
  {
    id: "display",
    label: "Display",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
  },
  {
    id: "sound",
    label: "Sound",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  {
    id: "character",
    label: "Character",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

/* ────────────────── Reusable components ────────────────── */

type SliderProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

const SettingsSlider = ({ label, value, onChange, min = 0, max = 100 }: SliderProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="min-w-[3ch] text-right text-sm font-bold text-amber-400">{value}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="settings-slider w-full cursor-pointer"
      aria-label={label}
    />
  </div>
);

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
};

const SettingsCheckbox = ({ label, checked, onChange, description }: CheckboxProps) => (
  <label className="group flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-slate-800/50">
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
        checked
          ? "border-amber-500 bg-amber-500/20"
          : "border-slate-600 bg-slate-800"
      }`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      {checked && (
        <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
      aria-label={label}
    />
    <div>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
    </div>
  </label>
);

/* ────────────────── Display Tab ────────────────── */

const DisplayTab = () => {
  const { settings, update, reset } = useDisplaySettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-display text-sm tracking-wider text-slate-500">Brightness</h3>
        <SettingsSlider
          label="Brightness"
          value={settings.brightness}
          onChange={(v) => update({ brightness: v })}
        />
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm tracking-wider text-slate-500">Combat</h3>
        <div className="space-y-1">
          <SettingsCheckbox
            label="Combat Animations"
            checked={settings.combatAnimations}
            onChange={(v) => update({ combatAnimations: v })}
            description="Show animated effects during battles"
          />
          <SettingsCheckbox
            label="Damage Numbers"
            checked={settings.showDamageNumbers}
            onChange={(v) => update({ showDamageNumbers: v })}
            description="Display floating damage values in combat"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm tracking-wider text-slate-500">Notifications</h3>
        <SettingsCheckbox
          label="Show Notifications"
          checked={settings.showNotifications}
          onChange={(v) => update({ showNotifications: v })}
          description="In-game alerts and upgrade notices"
        />
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        aria-label="Reset display settings to defaults"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

/* ────────────────── Sound Tab ────────────────── */

const SoundTab = () => {
  const { settings, update, reset } = useSoundSettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-display text-sm tracking-wider text-slate-500">Volume</h3>
        <div className="space-y-5">
          <SettingsSlider
            label="Master Volume"
            value={settings.masterVolume}
            onChange={(v) => update({ masterVolume: v })}
          />
          <SettingsSlider
            label="Effects Volume"
            value={settings.effectsVolume}
            onChange={(v) => update({ effectsVolume: v })}
          />
          <SettingsSlider
            label="Ambient Volume"
            value={settings.ambientVolume}
            onChange={(v) => update({ ambientVolume: v })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        aria-label="Reset sound settings to defaults"
      >
        Reset to Defaults
      </button>
    </div>
  );
};

/* ────────────────── Character Tab (Origin Change) ────────────────── */

const CharacterTab = () => {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const [currentOrigin, setCurrentOrigin] = useState<CharacterOrigin | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<CharacterOrigin | null>(null);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    const loadCharacter = async () => {
      try {
        const res = await fetch(`/api/characters/${characterId}`);
        if (!res.ok) return;
        const data = await res.json();
        const char = data.character ?? data;
        setCurrentOrigin(char.origin as CharacterOrigin);
        setSelectedOrigin(char.origin as CharacterOrigin);
        setGold(char.gold ?? 0);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    loadCharacter();
  }, [characterId]);

  const handleChangeOrigin = async () => {
    if (!characterId || !selectedOrigin || selectedOrigin === currentOrigin) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/origin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: selectedOrigin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to change origin");
        return;
      }
      setCurrentOrigin(selectedOrigin);
      setGold(data.character.gold);
      setSuccess(`Origin changed to ${ORIGIN_DEFS[selectedOrigin].label}!`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!characterId) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Select a character from the Hub to change origin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current origin */}
      <div>
        <h3 className="mb-4 font-display text-sm tracking-wider text-slate-500">
          Current Origin
        </h3>
        {currentOrigin && (
          <div className={`flex items-center gap-3 rounded-xl border ${ORIGIN_BORDER[currentOrigin]?.split(" ")[0] ?? "border-slate-700"} bg-gradient-to-r ${ORIGIN_GRADIENT[currentOrigin]} p-4`}>
            <span className="text-3xl">{ORIGIN_DEFS[currentOrigin].icon}</span>
            <div>
              <p className={`text-sm font-bold ${ORIGIN_ACCENT[currentOrigin]}`}>
                {ORIGIN_DEFS[currentOrigin].label}
              </p>
              <p className="text-xs text-slate-400">
                {ORIGIN_DEFS[currentOrigin].bonusDescription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change origin */}
      <div>
        <h3 className="mb-3 font-display text-sm tracking-wider text-slate-500">
          Change Origin
          <span className="ml-2 text-yellow-500">
            (Cost: {ORIGIN_CHANGE_COST} gold — You have {gold})
          </span>
        </h3>

        <div className="grid grid-cols-5 gap-2">
          {ALL_ORIGINS.map((o) => {
            const def = ORIGIN_DEFS[o];
            const isSelected = selectedOrigin === o;
            const isCurrent = currentOrigin === o;

            return (
              <button
                key={o}
                type="button"
                onClick={() => setSelectedOrigin(o)}
                className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200
                  ${isSelected
                    ? `bg-gradient-to-b ${ORIGIN_GRADIENT[o]} ${ORIGIN_BORDER[o]?.split(" ")[0]} shadow-lg`
                    : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80"
                  }
                `}
                aria-label={`Select origin ${def.label}`}
                aria-pressed={isSelected}
                tabIndex={0}
              >
                <span className="text-2xl">{def.icon}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider leading-tight text-center ${
                    isSelected ? ORIGIN_ACCENT[o] : "text-slate-400"
                  }`}
                >
                  {def.label}
                </span>
                {isCurrent && (
                  <span className="absolute -left-1 -top-1 rounded-full bg-slate-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    NOW
                  </span>
                )}
                {isSelected && !isCurrent && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected origin description */}
        {selectedOrigin && (
          <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-2.5 text-center">
            <p className={`text-xs font-medium ${ORIGIN_ACCENT[selectedOrigin]}`}>
              {ORIGIN_DEFS[selectedOrigin].description}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {ORIGIN_DEFS[selectedOrigin].bonusDescription}
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-center">
          <p className="text-xs text-green-400">{success}</p>
        </div>
      )}

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleChangeOrigin}
        disabled={saving || !selectedOrigin || selectedOrigin === currentOrigin || gold < ORIGIN_CHANGE_COST}
        className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30 disabled:opacity-50 disabled:hover:from-amber-600 disabled:hover:to-orange-600"
        aria-label="Confirm origin change"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Changing…
          </span>
        ) : selectedOrigin === currentOrigin ? (
          "Current Origin"
        ) : gold < ORIGIN_CHANGE_COST ? (
          "Not Enough Gold"
        ) : (
          `Change Origin (${ORIGIN_CHANGE_COST} Gold)`
        )}
      </button>
    </div>
  );
};

/* ────────────────── Account Tab ────────────────── */

const AccountTab = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /* modal state */
  const [modal, setModal] = useState<"password" | "email" | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  /* form fields */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser({
          username: authUser.user_metadata?.username ?? authUser.email?.split("@")[0] ?? "User",
          email: authUser.email ?? "",
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const masked = local.length <= 2
      ? local[0] + "***"
      : local[0] + "***" + local.slice(-1);
    return `${masked}@${domain}`;
  };

  const handleResetModal = useCallback(() => {
    setModal(null);
    setFormError(null);
    setFormSuccess(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail("");
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to change password");
        return;
      }
      setFormSuccess("Password changed successfully");
      setTimeout(handleResetModal, 1500);
    } catch {
      setFormError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) {
      setFormError("Invalid email address");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/user/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to change email");
        return;
      }
      setFormSuccess("Confirmation sent to new email");
      setTimeout(handleResetModal, 2000);
    } catch {
      setFormError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User info */}
      <div>
        <h3 className="mb-4 font-display text-sm tracking-wider text-slate-500">Account Info</h3>
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Username</span>
            <span className="text-sm font-bold text-white">{user?.username ?? "—"}</span>
          </div>
          <div className="h-px bg-slate-700/50" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Email</span>
            <span className="text-sm font-medium text-slate-300">{user?.email ? maskEmail(user.email) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="mb-3 font-display text-sm tracking-wider text-slate-500">Security</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setModal("password")}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            aria-label="Change Password"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => setModal("email")}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            aria-label="Change Email"
          >
            Change Email Address
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-800 hover:bg-red-950/50 hover:text-red-300"
          aria-label="Log Out"
        >
          Log Out
        </button>
      </div>

      {/* ── Modal overlay ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleResetModal}
          onKeyDown={(e) => e.key === "Escape" && handleResetModal()}
          role="dialog"
          aria-modal="true"
          aria-label={modal === "password" ? "Change Password" : "Change Email"}
          tabIndex={-1}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
            role="document"
            tabIndex={0}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleResetModal}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close modal"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="mb-4 font-display text-xl text-white">
              {modal === "password" ? "Change Password" : "Change Email"}
            </h3>

            {formSuccess && (
              <div className="mb-4 rounded-lg border border-green-800/50 bg-green-950/30 px-3 py-2 text-sm text-green-400">
                {formSuccess}
              </div>
            )}
            {formError && (
              <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                {formError}
              </div>
            )}

            {modal === "password" ? (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className="mb-1 block text-xs font-medium text-slate-400">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="mb-1 block text-xs font-medium text-slate-400">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-slate-400">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    placeholder="Repeat new password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="mt-2 w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                >
                  {formLoading ? "Saving…" : "Change Password"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleChangeEmail} className="space-y-3">
                <div>
                  <label htmlFor="newEmail" className="mb-1 block text-xs font-medium text-slate-400">
                    New Email Address
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="mt-2 w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                >
                  {formLoading ? "Sending…" : "Change Email"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────── Settings Page Content ────────────────── */

const SettingsContent = () => {
  const [activeTab, setActiveTab] = useState<TabId>("display");

  return (
    <div className="relative p-4 lg:p-6">
      <PageHeader title="Settings" />

      {/* Settings card */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/50">
        {/* Tab bar */}
        <div className="flex border-b border-slate-800">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? "border-b-2 border-amber-500 text-amber-400"
                    : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"
                }`}
                aria-label={tab.label}
                aria-selected={isActive}
                role="tab"
                tabIndex={0}
              >
                <span
                  className={`transition ${
                    isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5 sm:p-6">
          {activeTab === "display" && <DisplayTab />}
          {activeTab === "sound" && <SoundTab />}
          {activeTab === "character" && <CharacterTab />}
          {activeTab === "account" && <AccountTab />}
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Page Export ────────────────── */

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader emoji="⚙️" text="Loading settings…" />}>
      <SettingsContent />
    </Suspense>
  );
}
