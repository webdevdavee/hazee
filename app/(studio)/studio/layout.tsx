import Navbar from "../_components/Navbar";

export default async function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <section className="wrapper">{children}</section>
    </>
  );
}
