import { IoIosArrowDown } from "react-icons/io";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "../ui/Button";
import NftCard from "../cards/NftCard";
import { sampleNfts } from "@/constants";

const Auctions = () => {
  return (
    <section className="container w-full">
      <div>
        <div className="flex items-center gap-8">
          <h1>Auctions</h1>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-3 border border-secondary text-sm py-2 px-3 rounded-full">
              <p>Popular</p>
              <IoIosArrowDown />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-base w-[95px] text-center border border-secondary rounded-md"
                sideOffset={5}
              >
                <DropdownMenu.Item className="hover:bg-secondary hover:transition">
                  <button type="button" className="w-full">
                    New
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <ul className="flex items-center gap-4">
            <Button text="All" style="bg-primary text-sm px-4" />
            <Button
              text="Art"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
            <Button
              text="Gaming"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
            <Button
              text="Music"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
          </ul>
        </div>
        <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6 p-3">
          {sampleNfts.slice(0, 4).map((nft) => (
            <NftCard key={nft.id} nft={nft} type="auction" />
          ))}
        </div>
        <div className="w-full flex items-center justify-center mt-8">
          <Button
            text="Load more"
            style="border border-secondary rounded-full hover:bg-secondary hover:transition"
          />
        </div>
      </div>
    </section>
  );
};

export default Auctions;
