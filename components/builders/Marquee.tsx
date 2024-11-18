"use client";

import { marqueeImages } from "@/constants";
import Marqueeframe from "../ui/Marqueeframe";
import { motion } from "framer-motion";

const Marquee = () => {
  return (
    <section className="flex gap-6 mx-auto">
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: "-100%" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="mt-20 flex flex-shrink-0 gap-6"
      >
        {marqueeImages.map((img) => (
          <Marqueeframe key={img} src={img} />
        ))}
      </motion.div>
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: "-100%" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="mt-20 flex flex-shrink-0 gap-6"
      >
        {marqueeImages.map((img) => (
          <Marqueeframe key={img} src={img} />
        ))}
      </motion.div>
    </section>
  );
};

export default Marquee;
