import Link from "next/link";

const Footer = () => {
  // Get current year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-t-gray-400 p-6">
      <p className="text-sm text-center text-slate-300">
        &copy; {currentYear} Hazee. All rights reserved. Design inspiration
        credits:{" "}
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
