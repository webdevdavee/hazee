import Image from "next/image";
import Link from "next/link";

type Props = {
  collections: CollectionInfo[];
};

const CollectionsTableBody: React.FC<Props> = ({ collections }) => {
  return (
    <tbody>
      {collections.slice(0, 8).map((collection, index) => (
        <tr key={collection.collectionId}>
          <td className="text-sm p-3">{index + 1}</td>
          <td>
            <Link
              href={`/collection/${collection.collectionId}`}
              className="flex items-center gap-3 w-fit m:gap-0"
            >
              <Image
                src={collection.imageUrl as string}
                width={1000}
                height={1000}
                alt="collection"
                className="rounded-md w-[3.5rem] h-[3.5rem] m:hidden"
              />
              <p className="text-sm p-3 m:p-0">{collection.name}</p>
            </Link>
          </td>
          <td className="text-sm p-3">{collection.floorPrice}</td>
          <td className="text-sm p-3">{collection.maxSupply}</td>
          <td className="text-sm p-3">{collection.mintedSupply}</td>
        </tr>
      ))}
    </tbody>
  );
};

export default CollectionsTableBody;
