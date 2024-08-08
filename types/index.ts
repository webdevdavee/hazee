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

type Creator = {
  username: string;
  name: string;
  src: string;
  owns: number;
  sold: number;
  created: number;
};

type DropdownItem = {
  id: number | string;
  label: string;
  link?: string;
  icon?: React.ReactNode;
  isButton?: boolean;
};
