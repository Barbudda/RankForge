"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { AgentSettings, SeoCategory } from "@/types";
import { saveAgentSettings } from "@/lib/data/actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CATEGORY_META } from "@/lib/seo/constants";
import { AutonomyLevelPicker } from "./autonomy-level-picker";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        {desc && <div className="text-xs text-fg-subtle">{desc}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
          checked ? "bg-electric" : "bg-border",
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: AgentSettings }) {
  const [settings, setSettings] = useState<AgentSettings>(initial);
  // Raw textarea text for excluded paths — kept verbatim so the user can press
  // Enter / leave blank lines while typing; normalized to globs in `settings`.
  const [excludedText, setExcludedText] = useState(
    initial.excludedPaths.join("\n"),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AgentSettings>(
    key: K,
    value: AgentSettings[K],
  ) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await saveAgentSettings(settings);
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Couldn't save settings.");
  };

  const onExcludedChange = (text: string) => {
    setExcludedText(text);
    setSettings((s) => ({
      ...s,
      excludedPaths: text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    }));
    setSaved(false);
  };

  const toggleCategory = (cat: SeoCategory) => {
    const has = settings.allowedCategories.includes(cat);
    update(
      "allowedCategories",
      has
        ? settings.allowedCategories.filter((c) => c !== cat)
        : [...settings.allowedCategories, cat],
    );
  };

  return (
    <div className="space-y-6">
      {/* Agent mode */}
      <Card>
        <CardHeader>
          <CardTitle>Modification level</CardTitle>
          <CardDescription>
            Choose how far RankForge may go by default — from plain advice to
            full root autonomy. Each repository can override this.
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <AutonomyLevelPicker
            value={settings.mode}
            onChange={(m) => update("mode", m)}
          />
        </div>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Limits & cadence</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border px-5 pb-2">
          <Toggle
            label="Weekly audit"
            desc="Automatically re-audit connected repos every week."
            checked={settings.weeklyAudit}
            onChange={(v) => update("weeklyAudit", v)}
          />
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="text-sm font-medium text-fg">
                Max PRs per week
              </div>
              <div className="text-xs text-fg-subtle">
                A safety cap on automated pull requests.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={30}
                value={settings.maxPrsPerWeek}
                onChange={(e) => update("maxPrsPerWeek", Number(e.target.value))}
                aria-label="Max PRs per week"
                className="w-40 accent-[var(--color-electric)]"
              />
              <span className="w-8 text-right font-mono text-sm font-semibold text-fg">
                {settings.maxPrsPerWeek}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Allowed categories */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed categories</CardTitle>
          <CardDescription>
            Only issues in these categories become pull requests.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {(Object.keys(CATEGORY_META) as SeoCategory[]).map((cat) => {
            const active = settings.allowedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-electric/40 bg-electric/10 text-fg"
                    : "border-border bg-surface/40 text-fg-subtle hover:text-fg",
                )}
              >
                {active && <Check className="size-3.5 text-electric-bright" />}
                {CATEGORY_META[cat].label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Excluded paths */}
      <Card>
        <CardHeader>
          <CardTitle>Excluded paths</CardTitle>
          <CardDescription>
            Globs RankForge will never touch (one per line).
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <textarea
            rows={3}
            value={excludedText}
            onChange={(e) => onExcludedChange(e.target.value)}
            placeholder={"e.g.\n/admin/**\n/legacy/**"}
            className="w-full rounded-lg border border-border bg-code p-3 font-mono text-xs text-fg outline-none placeholder:text-fg-subtle focus-visible:border-electric/50"
          />
        </div>
      </Card>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3">
        {/* Always-mounted live region so save results are announced. */}
        <span role="status" aria-live="polite">
          {error && <span className="text-sm text-danger">{error}</span>}
          {saved && !error && (
            <span className="flex items-center gap-1.5 text-sm text-signal">
              <Check className="size-4" />
              Settings saved
            </span>
          )}
        </span>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-electric px-5 text-sm font-medium text-white transition-colors hover:bg-electric-bright disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
