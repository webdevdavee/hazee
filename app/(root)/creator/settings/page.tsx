import EditProfileForm from "@/components/creators/EditProfileForm";

const page = () => {
  return (
    <section className="flex items-center justify-center flex-col gap-5 px-24">
      <h1>Profile details</h1>
      <EditProfileForm />
    </section>
  );
};

export default page;
