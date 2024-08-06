"use client";

type Props = {
  text: string;
  style?: string;
  type?: "button" | "submit" | "reset";
  onclick?: () => void;
  onhover?: () => void;
};

const Button: React.FC<Props> = ({ text, style, type, onclick, onhover }) => {
  return (
    <button
      type={type ?? "button"}
      className={`p-[0.6rem] ${style} rounded-full`}
      onClick={onclick}
      onMouseOver={onhover}
      onMouseOut={onhover}
    >
      {text}
    </button>
  );
};

export default Button;
