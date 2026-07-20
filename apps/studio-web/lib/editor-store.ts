"use client";
import { create } from "zustand";

type EditorUi = { leftTab: "agent" | "transcript"; rightTab: "media" | "settings" | "exports"; zoom: number; selectedWordIndexes: number[]; setLeftTab: (value: EditorUi["leftTab"]) => void; setRightTab: (value: EditorUi["rightTab"]) => void; setZoom: (value: number) => void; selectWord: (index: number, extend: boolean) => void; clearSelection: () => void };
export const useEditorStore = create<EditorUi>((set) => ({
  leftTab: "agent", rightTab: "media", zoom: 1, selectedWordIndexes: [],
  setLeftTab: (leftTab) => set({ leftTab }), setRightTab: (rightTab) => set({ rightTab }), setZoom: (zoom) => set({ zoom }), clearSelection: () => set({ selectedWordIndexes: [] }),
  selectWord: (index, extend) => set((state) => { if (!extend || !state.selectedWordIndexes.length) return { selectedWordIndexes: [index] }; const start = Math.min(state.selectedWordIndexes[0]!, index); const end = Math.max(state.selectedWordIndexes[0]!, index); return { selectedWordIndexes: Array.from({ length: end - start + 1 }, (_, offset) => start + offset) }; }),
}));
