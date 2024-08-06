import Image from "next/image";

type Props = {
  src: string;
};

const Marqueeframe: React.FC<Props> = ({ src }) => {
  return (
    <section>
      <Image
        src={src}
        width={250}
        height={250}
        quality={100}
        priority
        alt="marquee"
        className="rounded-xl object-cover"
      />
    </section>
  );
};

export default Marqueeframe;
