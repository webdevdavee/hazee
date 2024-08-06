import { useState } from "react";

const useDropdown = (initialItems: DropdownItem[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items] = useState(initialItems);

  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    items,
    toggle,
  };
};

export default useDropdown;
