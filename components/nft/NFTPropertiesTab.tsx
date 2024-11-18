type Props = { nft: TokenInfo };

const NFTPropertiesTab: React.FC<Props> = ({ nft }) => {
  return (
    <table>
      <thead>
        <tr>
          <th className="text-[gray] text-left">Type</th>
          <th className="text-[gray] text-left">Name</th>
        </tr>
      </thead>
      <tbody>
        {nft.metadata?.attributes?.map((attr, index) => (
          <tr
            key={`${attr.trait_type}-${index}`}
            className="border border-secondary rounded-md p-4"
          >
            <td>
              <p>{attr.trait_type}</p>
            </td>
            <td>
              <p>{attr.value}</p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default NFTPropertiesTab;
