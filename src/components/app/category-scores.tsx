import type { CategoryScore } from "@/types";
import { CATEGORY_META } from "@/lib/seo/constants";
import { scoreColor } from "@/lib/scoring";
import { Progress } from "@/components/ui/misc";

export function CategoryScores({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="space-y-4">
      {categories.map((c) => (
        <div key={c.category}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-fg">
              {CATEGORY_META[c.category].label}
            </span>
            <span className="flex items-center gap-3">
              {c.issues > 0 && (
                <span className="text-xs text-fg-subtle">
                  {c.issues} issue{c.issues === 1 ? "" : "s"}
                </span>
              )}
              <span
                className="font-mono font-semibold tabular-nums"
                style={{ color: scoreColor(c.score) }}
              >
                {c.score}
              </span>
            </span>
          </div>
          <Progress value={c.score} color={scoreColor(c.score)} />
        </div>
      ))}
    </div>
  );
}
