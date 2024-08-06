type sampleNft = {
  id: number;
  name: string;
  src: string;
  price: string;
  bid?: string;
  ends?: string;
};

type Collection = {
  name: string;
  by: string;
  volume: string;
  floor: string;
  src: string;
};

type topCreator = {
  username: string;
  name: string;
  src: string;
  owns: number;
  sold: number;
  created: number;
};

type DropdownItem = {
  id: string | number;
  label: string;
  link?: string;
  icon?: React.ReactNode;
};
