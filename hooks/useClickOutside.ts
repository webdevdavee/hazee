import { useEffect } from "react";

export const useClickOutside = (
  ref: React.RefObject<HTMLDivElement>,
  onClickOutside: (value: React.SetStateAction<boolean>) => void
) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside(false);
      }
    };

    const preventBubbling = (e: MouseEvent) => {
      e.stopPropagation();
    };

    document.addEventListener("mousedown", handler);
    ref.current?.addEventListener("mousedown", preventBubbling);

    return () => {
      document.removeEventListener("mousedown", handler);
      ref.current?.removeEventListener("mousedown", preventBubbling);
    };
  }, [ref, onClickOutside]);
};

export default useClickOutside;
