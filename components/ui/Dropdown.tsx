import Link from "next/link";

type DropdownProps = {
  items: DropdownItem[];
  isOpen: boolean;
};

const Dropdown: React.FC<DropdownProps> = ({ items, isOpen }) => {
  return (
    <section
      className="absolute p-4 rounded-xl bg-base border border-secondary shadow-md z-[45]"
      style={{ display: isOpen ? "block" : "none" }}
    >
      <div>
        <div
          className="py-1"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          {items.map((item) => (
            <Link
              href={item.link ?? "#"}
              key={item.id}
              className="flex items-center w-full px-4 py-2 text-sm font-medium hover:rounded-md hover:transition hover:bg-secondary"
              role="menuitem"
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Dropdown;
