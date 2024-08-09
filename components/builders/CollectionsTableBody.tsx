import Image from "next/image";
import Link from "next/link";

type Props = {
  collections: Collection[];
};

const CollectionsTableBody: React.FC<Props> = ({ collections }) => {
  return (
    <tbody>
      {collections.map((collection, index) => (
        <tr key={collection.name}>
          <td className="text-sm p-3">{index + 1}</td>
          <td>
            <Link href="#" className="flex items-center gap-3 w-fit">
              <Image
                src={collection.src[0]}
                width={55}
                height={55}
                alt="collection"
                className="rounded-md h-[3.5rem]"
              />
              <p className="text-sm p-3">{collection.name}</p>
            </Link>
          </td>
          <td className="text-sm p-3">{collection.floor}</td>
          <td className="text-sm p-3">{collection.volume}</td>
          <td className="text-sm p-3">1.5K</td>
          <td className="text-sm p-3">44K</td>
        </tr>
      ))}
    </tbody>
  );
};

export default CollectionsTableBody;
