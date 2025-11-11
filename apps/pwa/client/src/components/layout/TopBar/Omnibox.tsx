"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useState } from "react";

import { useOmnibox } from "@/src/hooks/useOmnibox";
import { useLocaleMessages } from "@/src/hooks/useLocaleMessages";

import styles from "./Omnibox.module.css";
import { OmniboxSuggestions } from "./OmniboxSuggestions";

export function Omnibox() {
  const [value, setValue] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const listboxId = useId();
  const { suggestions, groupedSuggestions, selectSuggestion } = useOmnibox(value);
  const { navigation } = useLocaleMessages();

  const hasSuggestions = value.trim().length > 0 && suggestions.length > 0;

  const suggestionGroups = useMemo(
    () =>
      (Object.keys(groupedSuggestions) as (keyof typeof groupedSuggestions)[])
        .map((type) => ({
          type,
          label: navigation.omniboxGroups?.[type] ?? type,
          items: groupedSuggestions[type] ?? [],
        }))
        .filter((group) => group.items.length > 0),
    [groupedSuggestions, navigation.omniboxGroups]
  );

  useEffect(() => {
    if (!hasSuggestions) {
      setActiveId(undefined);
      return;
    }

    setActiveId((current) => {
      if (!current) {
        return suggestions[0]?.id;
      }
      const exists = suggestions.some((item) => item.id === current);
      return exists ? current : suggestions[0]?.id;
    });
  }, [hasSuggestions, suggestions]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hasSuggestions) {
      if (event.key === "Escape") {
        setValue("");
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = suggestions.findIndex((item) => item.id === activeId);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + suggestions.length) % suggestions.length;
      setActiveId(suggestions[nextIndex]?.id);
      return;
    }

    if (event.key === "Enter" && activeId) {
      event.preventDefault();
      const selected = suggestions.find((item) => item.id === activeId);
      if (selected) {
        selectSuggestion(selected);
        setValue("");
        setActiveId(undefined);
      }
      return;
    }

    if (event.key === "Escape") {
      setActiveId(undefined);
      setValue("");
    }
  };

  return (
    <div className={styles.wrapper}>
      <input
        type="search"
        className={styles.input}
        role="combobox"
        placeholder={navigation.searchPlaceholder}
        aria-label={navigation.searchPlaceholder}
        aria-expanded={hasSuggestions}
        aria-haspopup="listbox"
        aria-controls={hasSuggestions ? listboxId : undefined}
        aria-activedescendant={hasSuggestions && activeId ? `${listboxId}-${activeId}` : undefined}
        aria-autocomplete="list"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {hasSuggestions ? (
        <OmniboxSuggestions
          id={listboxId}
          className={styles.suggestions}
          groups={suggestionGroups}
          activeId={activeId}
          onHighlight={(suggestion) => setActiveId(suggestion.id)}
          onSelect={(suggestion) => {
            selectSuggestion(suggestion);
            setValue("");
            setActiveId(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
