import TruncateText from "../builders/TruncateText";

type Props = { collection: Collection | undefined };

const CollectionInfo: React.FC<Props> = ({ collection }) => {
  return (
    <div className="flex justify-between">
      <div className="w-[60%] flex flex-col gap-3">
        <h1 className="mt-3 font-medium">{collection?.name}</h1>
        <p className="text-[gray]">Created by Hazee</p>
        <TruncateText
          text={
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos aliaspraesentium asperiores tempora inventore ad? At vitae porro istedoloribus. Laborum enim ea omnis tempore, cupiditate dolorum, quodincidunt natus error alias beatae totam quia. Pariatur, a? Quod,accusantium eveniet sunt culpa ipsum soluta eius quae ea quaerat autemodit magnam eum id officiis aut omnis, cumque, repellendus explicabodeleniti sint illo nesciunt quas vero. Inventore doloribus temporaimpedit cupiditate debitis unde quia voluptatum culpa recusandae. Estamet harum atque soluta exercitationem porro, ex accusantium natusexplicabo? Doloremque, maiores non! Modi laborum expedita dignissimosdolorem sint nemo non error aperiam."
          }
          maxChars={200}
          className="text-[gray]"
        />
      </div>
      <div className="w-[25%] rounded-2xl border border-secondary p-4 border-opacity-50">
        <div className="flex flex-col gap-4 border-b border-b-secondary pb-4">
          <div className="flex items-center justify-between">
            <p>Floor</p>
            <p>{collection?.floor}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Volume</p>
            <p>{collection?.volume}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Items</p>
            <p>5.7K</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Owners</p>
            <p>1.4K</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <p>Blockchain</p>
            <p>Ethereum</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionInfo;
