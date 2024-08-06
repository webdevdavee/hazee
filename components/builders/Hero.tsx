import React from "react";

const Hero = () => {
  return (
    <section className="py-28 px-36">
      <div className="flex flex-col gap-5">
        <p className="py-2 px-4 rounded-full text-sm text-white bg-secondary w-fit">
          Discover NFT
        </p>
        <h1 className="text-6xl text-white">
          Ready to get <br /> started?
        </h1>
        <p className="text-[gray]">Explore, sell and create your NFTs.</p>
      </div>
    </section>
  );
};

export default Hero;
