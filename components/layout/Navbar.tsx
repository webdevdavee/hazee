import Link from "next/link";
import Searchbar from "../ui/Searchbar";
import Button from "../ui/Button";

const Navbar = () => {
  return (
    <section className="sticky top-0 z-50">
      <div className="backdrop-blur-md bg-base/70">
        <nav className="container mx-auto flex items-center justify-between py-4">
          <div className="flex gap-10 items-center">
            <Link href="/" className="text-white text-2xl">
              Hazee.
            </Link>
            <Searchbar />
          </div>
          <ul className="flex gap-5 items-center">
            <Link
              href="/"
              className="text-[gray] font-medium hover:text-white transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/"
              className="text-[gray] font-medium hover:text-white transition-colors"
            >
              Collections
            </Link>
            <Link
              href="/"
              className="text-[gray] font-medium hover:text-white transition-colors"
            >
              Gallery
            </Link>
            <Button text="Connect wallet" style="bg-primary font-medium" />
          </ul>
        </nav>
      </div>
    </section>
  );
};

export default Navbar;
