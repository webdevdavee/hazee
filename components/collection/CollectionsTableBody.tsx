import Image from "next/image";
import Link from "next/link";

type Props = {
  collections: CollectionInfo[];
};

const CollectionsTableBody: React.FC<Props> = ({ collections }) => {
  return (
    <tbody>
      {collections.map((collection, index) => (
        <tr key={collection.name}>
          <td className="text-sm p-3">{index + 1}</td>
          <td>
            <Link
              href={`/collection/${collection.collectionId}`}
              className="flex items-center gap-3 w-fit"
            >
              <Image
                src={collection.imageUrl as string}
                width={55}
                height={55}
                alt="collection"
                className="rounded-md h-[3.5rem]"
              />
              <p className="text-sm p-3">{collection.name}</p>
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
