import Link from "next/link";

const Footer = () => {
  // Get current year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="container border-t border-t-gray-400 p-6">
      <p className="text-sm text-center text-slate-300">
        &copy; {currentYear} Hazee. All rights reserved. Design credits:{" "}
        <Link
          href="https://dribbble.com/shots/18847976-Kalao-Web-Design-for-NFT-Marketplace"
          target="blank"
          className="text-primary underline"
        >
          Outcrowd ❤
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
