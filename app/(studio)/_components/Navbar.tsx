import Button from "@/components/ui/Button";

const Navbar = () => {
  return (
    <section className="sticky top-0 z-40">
      <nav className="mx-8 flex items-center justify-end py-4">
        <Button text="Connect wallet" style="bg-primary font-medium" />
      </nav>
    </section>
  );
};

export default Navbar;
