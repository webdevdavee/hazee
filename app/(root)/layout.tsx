import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default async function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <section className="wrapper">{children}</section>
      <Footer />
    </>
  );
}
