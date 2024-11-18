import Link from "next/link";

const Footer = () => {
  // Get current year
  const currentYear = new Date().getFullYear();
  //dribbble.com/shots/18847976-Kalao-Web-Design-for-NFT-Marketplace

  https: return (
    <footer className="border-t border-t-secondary p-6">
      <p className="text-sm text-center text-slate-300 m:text-xs">
        &copy; {currentYear} Hazee. All rights reserved. Design inspiration
        credit:{" "}
        <Link
          href="https://dribbble.com/outcrowd"
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
