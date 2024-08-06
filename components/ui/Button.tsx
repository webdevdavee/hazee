"use client";

type Props = {
  text: string;
  style?: string;
  type?: "button" | "submit" | "reset";
};

const Button: React.FC<Props> = ({ text, style, type }) => {
  return (
    <button
      type={type ?? "button"}
      className={`p-[0.6rem] ${style} rounded-full`}
    >
      {text}
    </button>
  );
};

export default Button;
