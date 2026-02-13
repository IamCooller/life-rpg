"use client";

import { SKILL_META, SKILL_CATEGORIES } from "@/lib/skill-constants";

interface CategorySelectProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function CategorySelect({ name, value, onChange }: CategorySelectProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SKILL_CATEGORIES.map((cat) => {
        const meta = SKILL_META[cat];
        const isSelected = value === cat;
        return (
          <label
            key={cat}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
              isSelected
                ? "border-accent-purple bg-accent-purple/10"
                : "border-card-border hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={cat}
              checked={isSelected}
              onChange={(e) => onChange?.(e.target.value)}
              className="hidden"
            />
            <span className="text-xs" style={{ color: meta.color }}>
              {meta.name}
            </span>
          </label>
        );
      })}
    </div>
  );
}
