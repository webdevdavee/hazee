import React from "react";

interface GradientBorderProps {
  children: React.ReactNode;
}

const GradientBorder: React.FC<GradientBorderProps> = ({ children }) => {
  return (
    <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      {children}
    </div>
  );
};

export default GradientBorder;
