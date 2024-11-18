import { StateCreator, create } from "zustand";

interface OverlayState {
  isVisible: boolean;
  showOverlay: () => void;
  hideOverlay: () => void;
}

const overlayStore: StateCreator<OverlayState> = (set) => ({
  isVisible: false,
  showOverlay: () => set({ isVisible: true }),
  hideOverlay: () => set({ isVisible: false }),
});

export const useOverlayStore = create(overlayStore);
