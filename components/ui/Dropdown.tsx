import React from "react";
import Link from "next/link";

type Props = {
  items: DropdownItem[];
  isOpen: boolean;
  selectItem?: (item: DropdownItem) => void;
};

const Dropdown: React.FC<Props> = ({ items, isOpen, selectItem }) => {
  return (
    <section className="absolute">
      <div
        className={`relative p-4 rounded-xl bg-base border border-secondary shadow-md z-[45] ${
          isOpen ? "block" : "hidden"
        } mt-2`}
      >
        <div
          className="py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          {items.map((item) =>
            item.isButton ? (
              <button
                key={item.id}
                onClick={() => selectItem?.(item)}
                className="flex items-center w-full px-4 py-2 text-sm font-medium hover:rounded-md hover:transition hover:bg-secondary text-left"
                role="menuitem"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </button>
            ) : (
              <Link
                href={item.link ?? "#"}
                key={item.id}
                className="flex items-center w-full px-4 py-2 text-sm font-medium hover:rounded-md hover:transition hover:bg-secondary"
                role="menuitem"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default Dropdown;
