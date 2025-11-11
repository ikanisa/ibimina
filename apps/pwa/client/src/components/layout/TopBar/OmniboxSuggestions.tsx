"use client";

import type { OmniboxSuggestion } from "@/src/lib/omnibox";

import styles from "./OmniboxSuggestions.module.css";

type SuggestionGroup = {
  label: string;
  type: OmniboxSuggestion["type"];
  items: OmniboxSuggestion[];
};

type OmniboxSuggestionsProps = {
  groups: SuggestionGroup[];
  activeId?: string;
  onSelect: (suggestion: OmniboxSuggestion) => void;
  onHighlight: (suggestion: OmniboxSuggestion) => void;
  className?: string;
  id?: string;
};

export function OmniboxSuggestions({
  groups,
  activeId,
  onSelect,
  onHighlight,
  className,
  id,
}: OmniboxSuggestionsProps) {
  return (
    <div role="listbox" className={className} id={id}>
      {groups.map((group) => (
        <div key={group.type} className={styles.group} role="group" aria-label={group.label}>
          <span className={styles.groupLabel}>{group.label}</span>
          {group.items.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              id={id ? `${id}-${suggestion.id}` : suggestion.id}
              className={styles.item}
              data-active={suggestion.id === activeId}
              aria-selected={suggestion.id === activeId}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onHighlight(suggestion)}
            >
              <span className={styles.details}>
                <span className={styles.icon} aria-hidden="true">
                  {suggestion.icon}
                </span>
                <span className={styles.label}>{suggestion.label}</span>
              </span>
              <span className={styles.type}>{suggestion.type}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
