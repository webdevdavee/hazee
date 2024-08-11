import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Props = {
  creator: Creator;
};

const CreatorsCard: React.FC<Props> = ({ creator }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-2xl overflow-hidden"
    >
      <Link href={`/creators/${creator.id}`} className="block">
        <section className="bg-secondary p-4 relative">
          <div className="relative rounded-xl overflow-hidden">
            <div className="w-full flex items-center justify-center">
              <Image
                src={creator.src}
                width={200}
                height={200}
                quality={100}
                priority
                alt="creator"
                className="rounded-full h-48"
              />
            </div>
            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col">
                <p className="font-medium text-lg">{creator.username}</p>
                <p className="text-gray-400 text-sm">@{creator.name}</p>
              </div>
              <Link
                href={`/creators/${creator.id}`}
                className="bg-primary rounded-full p-2 text-center"
              >
                View profile
              </Link>
            </div>
          </div>
        </section>
      </Link>
    </motion.div>
  );
};

export default CreatorsCard;
