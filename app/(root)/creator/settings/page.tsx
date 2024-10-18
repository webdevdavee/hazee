import EditProfileForm from "@/components/creators/EditProfileForm";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Settings - Hazee",
  };
}

const page = async () => {
  return (
    <section className="flex items-center justify-center flex-col gap-5 px-24">
      <h1>Profile details</h1>
      <EditProfileForm />
    </section>
  );
};

export default page;
