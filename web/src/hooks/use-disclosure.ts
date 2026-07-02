"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Maneja estado abierto/cerrado para overlays (Drawer, Sheet, Dialog, MegaMenu).
 * API estable y memoizada para usar como controlador de cualquier disclosure.
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((v) => !v), []);

  return useMemo(
    () => ({ isOpen, onOpen, onClose, onToggle, setIsOpen }),
    [isOpen, onOpen, onClose, onToggle],
  );
}

export type UseDisclosureReturn = ReturnType<typeof useDisclosure>;
