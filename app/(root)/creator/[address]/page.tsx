import CreatorDetails from "@/components/creators/CreatorDetails";
import {
  getUserByWalletAddress,
  getUsers,
} from "@/database/actions/user.action";
import { Metadata } from "next";

type Params = {
  params: {
    address: string;
  };
};

export async function generateMetadata({
  params: { address },
}: Params): Promise<Metadata> {
  const user: User = await getUserByWalletAddress(address);
  return {
    title: `${user?.username || "Your profile"} - Hazee`,
  };
}

const page = async ({ params: { address } }: Params) => {
  const user: User = await getUserByWalletAddress(address);
  return (
    <>
      <CreatorDetails urlWalletAddress={address} userDetails={user} />
    </>
  );
};

export async function generateStaticParams() {
  const fetchedUsers = await getUsers();
  let users = [];
  users = fetchedUsers?.usersNoLimit ?? [];
  return users.map((user: User) => ({ walletAddress: user.walletAddress }));
}

export default page;
