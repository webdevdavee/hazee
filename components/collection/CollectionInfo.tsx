import { useWallet } from "@/context/WalletProvider";
import TruncateText from "../builders/TruncateText";
import React from "react";
import Link from "next/link";

type Props = { collection: CollectionInfo; creator: User | null };

const CollectionInfo: React.FC<Props> = ({ collection, creator }) => {
  const { walletAddress } = useWallet();
  const [collectionOwnerName, setCollectionOwnerName] = React.useState("");

  React.useEffect(() => {
    const getUsername = async () => {
      if (creator) {
        if (creator.walletAddress === walletAddress) {
          setCollectionOwnerName("You");
        } else {
          setCollectionOwnerName(creator.username);
        }
      }
    };

    getUsername();
  }, [collection.collectionId, walletAddress, collection.creator, creator]);

  return (
    <div className="flex justify-between m:flex-col m:gap-4">
      <div className="w-[60%] flex flex-col gap-3 m:gap-6 m:w-full">
        <h1 className="mt-3 font-medium m:text-3xl">{collection?.name}</h1>
        <div className="flex items-center gap-4">
          <p className="font-medium m:font-normal">
            Owned by{" "}
            <Link
              href={`/creator/${collection.creator}`}
              className="text-abstract underline underline-offset-4"
            >
              {collectionOwnerName}
            </Link>
          </p>
          <div className="flex items-center gap-1">
            <p>Royalties</p>
            <span className="p-1 rounded-md bg-abstract text-xs ml-1 font-medium">
              {collection.royaltyPercentage}%
            </span>
          </div>
        </div>
        <TruncateText
          text={collection.description as string}
          maxChars={200}
          className="text-[gray]"
        />
      </div>
      <div className="w-[25%] h-fit rounded-2xl border border-secondaryhover p-4 border-opacity-50 m:w-full xl:w-[40%]">
        <div className="flex flex-col gap-4 border-b border-b-secondary pb-4">
          <div className="flex items-center justify-between">
            <p>Floor Price</p>
            <p>{collection.floorPrice} ETH</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Minted tokens</p>
            <p>{collection.mintedSupply}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <p>Blockchain</p>
            <p>Ethereum</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionInfo;
