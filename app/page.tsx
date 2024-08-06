import Auctions from "@/components/builders/Auctions";
import Hero from "@/components/builders/Hero";
import Marquee from "@/components/builders/Marquee";

const page = () => {
  return (
    <section className="flex flex-col gap-6">
      <Hero />
      <Marquee />
      <Auctions />
    </section>
  );
};

export default page;
