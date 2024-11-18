import EditProfileForm from "@/components/creators/EditProfileForm";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Settings - Hazee",
  };
}

const page = async () => {
  return (
    <section className="flex items-center justify-center flex-col gap-5 px-24 m:px-0">
      <h1 className="m:text-2xl">Profile details</h1>
      <EditProfileForm />
    </section>
  );
};

export default page;
