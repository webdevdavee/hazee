import Button from "../ui/Button";

const TabsForNFT = () => {
  return (
    <section className="w-full flex items-center justify-center gap-6 mt-28">
      <Button
        text="Details"
        style="border-b-[2px] border-b-primary pb-2 rounded-none"
      />
      <Button text="About Seller" />
      <Button text="Traits" />
      <Button text="Bids" />
      <Button text="Activity" />
    </section>
  );
};

export default TabsForNFT;
