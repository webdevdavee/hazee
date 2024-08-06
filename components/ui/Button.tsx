"use client";

type Props = {
  text: string;
  style: string;
};

const Button: React.FC<Props> = ({ text, style }) => {
  return (
    <button
      type="button"
      className={`p-[0.6rem] ${style} text-white rounded-full`}
    >
      {text}
    </button>
  );
};

export default Button;
