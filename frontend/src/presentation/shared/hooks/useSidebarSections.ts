'use client';

import { useState, useEffect } from 'react';

export interface NavSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: { href: string; label: string; icon: React.ReactNode; badge?: string }[];
  defaultOpen?: boolean;
}

interface UseSidebarSectionsOptions {
  sections: NavSection[];
  currentPathname?: string;
  storageKey?: string;
}

const findActiveSectionId = (pathname: string | undefined, sections: NavSection[]): string | null => {
  if (!pathname) return null;
  for (const section of sections) {
    const isActive = section.items.some(
      item => pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (isActive) return section.id;
  }
  return null;
};

export function useSidebarSections({ sections, currentPathname, storageKey = 'sidebar-sections' }: UseSidebarSectionsOptions) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return sections.reduce((acc, s) => ({ ...acc, [s.id]: s.defaultOpen ?? false }), {});
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* empty */ }
    
    const activeId = findActiveSectionId(currentPathname, sections);
    if (activeId) {
      return sections.reduce((acc, s) => ({ ...acc, [s.id]: s.id === activeId }), {});
    }
    
    return sections.reduce((acc, s) => ({ ...acc, [s.id]: s.id === 'general' }), {});
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(openSections));
    } catch { /* empty */ }
  }, [openSections, storageKey]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const isSectionOpen = (sectionId: string): boolean => openSections[sectionId] ?? false;

  return { openSections, toggleSection, isSectionOpen };
}