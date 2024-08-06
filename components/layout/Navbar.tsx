import Link from "next/link";
import Searchbar from "../ui/Searchbar";
import Button from "../ui/Button";

const Navbar = () => {
  return (
    <section className="container">
      <nav className="flex items-center justify-between">
        <div className="flex gap-10 items-center">
          <Link href="/" className="text-white text-2xl">
            Hazee.
          </Link>
          <Searchbar />
        </div>
        <ul className="flex gap-5 items-center">
          <Link href="/" className="text-[gray] font-medium">
            Explore
          </Link>
          <Link href="/" className="text-[gray] font-medium">
            Collections
          </Link>
          <Link href="/" className="text-[gray] font-medium">
            Gallery
          </Link>
          <Button text="Connect wallet" style="bg-primary font-medium" />
        </ul>
      </nav>
    </section>
  );
};

export default Navbar;
