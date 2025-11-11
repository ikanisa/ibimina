"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchOmniboxIndex, type OmniboxSuggestion } from "@/src/lib/omnibox";

type GroupedSuggestions = Record<OmniboxSuggestion["type"], OmniboxSuggestion[]>;

const MAX_SUGGESTIONS = 8;

function groupSuggestions(list: OmniboxSuggestion[]): GroupedSuggestions {
  return list.reduce<GroupedSuggestions>(
    (acc, suggestion) => {
      acc[suggestion.type] = acc[suggestion.type] ?? [];
      acc[suggestion.type]!.push(suggestion);
      return acc;
    },
    { navigation: [], account: [], group: [], member: [], action: [] }
  );
}

export interface UseOmniboxResult {
  suggestions: OmniboxSuggestion[];
  groupedSuggestions: GroupedSuggestions;
  loading: boolean;
  selectSuggestion: (suggestion: OmniboxSuggestion) => void;
}

export function useOmnibox(query: string): UseOmniboxResult {
  const router = useRouter();
  const [index, setIndex] = useState<OmniboxSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    fetchOmniboxIndex()
      .then((items) => {
        if (active) {
          setIndex(items);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSuggestions = useMemo(() => {
    if (!normalizedQuery) return [] as OmniboxSuggestion[];

    return index
      .filter((item) => {
        const haystacks = [item.label, ...(item.keywords ?? [])];
        return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [index, normalizedQuery]);

  const groupedSuggestions = useMemo(
    () => groupSuggestions(filteredSuggestions),
    [filteredSuggestions]
  );

  const selectSuggestion = useCallback(
    (suggestion: OmniboxSuggestion) => {
      router.push(suggestion.href);
    },
    [router]
  );

  return { suggestions: filteredSuggestions, groupedSuggestions, loading, selectSuggestion };
}
