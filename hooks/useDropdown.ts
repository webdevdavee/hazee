import { useState } from "react";

const useDropdown = (
  initialItems: DropdownItem[],
  currentItemLabel?: string
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(
    currentItemLabel ?? null
  );

  const toggle = () => setIsOpen((prev) => !prev);

  const selectItem = (item: DropdownItem) => {
    setSelectedItem(item.label);
  };

  return {
    isOpen,
    items,
    selectedItem,
    toggle,
    selectItem,
    setItems,
  };
};

export default useDropdown;
