import Image from "next/image";
import React from "react";

type Props = {
  connectWallet: () => void;
};

const ConnectWallet: React.FC<Props> = ({ connectWallet }) => {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex gap-4 items-center cursor-pointer p-4 bg-secondary rounded-lg"
        onClick={connectWallet}
      >
        <Image src="/metamask-fox.svg" width={35} height={35} alt="metamask" />
        <p>Metamask</p>
      </div>
      <p className="text-sm text-center">More wallet options coming soon.</p>
    </div>
  );
};

export default ConnectWallet;
