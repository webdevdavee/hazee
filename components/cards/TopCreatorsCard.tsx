import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Props = {
  topCreator: topCreator;
};

const TopCreatorsCard: React.FC<Props> = ({ topCreator }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
    >
      <Link href="/" className="block">
        <section className="bg-secondary p-1 relative">
          <div className="relative rounded-xl overflow-hidden">
            <div className="w-full aspect-square relative">
              <Image
                src={topCreator.src}
                width={300}
                height={300}
                quality={100}
                priority
                alt="creator"
                className="object-cover h-[320px]"
              />
            </div>

            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col">
                <p className="font-medium text-lg">{topCreator.username}</p>
                <p className="text-gray-400 text-sm">@{topCreator.name}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-center">
                  <p className="text-gray-400">Sold</p>
                  <p>{topCreator.sold}</p>
                </div>
                <span className="bg-slate-200 w-[0.01rem] h-6" />
                <div className="flex flex-col items-center">
                  <p className="text-gray-400">Created</p>
                  <p>{topCreator.created}</p>
                </div>
                <span className="bg-slate-200 w-[0.01rem] h-6" />
                <div className="flex flex-col items-center">
                  <p className="text-gray-400">Owns</p>
                  <p>{topCreator.owns}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Link>
    </motion.div>
  );
};

export default TopCreatorsCard;
