"use client";

import { useCallback, useEffect, useState } from "react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface UseVideoContextMenuReturn {
  isOpen: boolean;
  position: ContextMenuPosition;
  openMenu: (event: React.MouseEvent<HTMLElement>) => void;
  closeMenu: () => void;
}

export function useVideoContextMenu(): UseVideoContextMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    const menuWidth = 260;
    const menuHeight = 220;

    const safeX = Math.min(event.clientX, window.innerWidth - menuWidth - 12);
    const safeY = Math.min(event.clientY, window.innerHeight - menuHeight - 12);

    setPosition({
      x: Math.max(12, safeX),
      y: Math.max(12, safeY),
    });

    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => closeMenu();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [isOpen, closeMenu]);

  return {
    isOpen,
    position,
    openMenu,
    closeMenu,
  };
}
