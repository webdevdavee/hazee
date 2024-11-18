"use client";

const SecondaryLoader = ({
  message,
  size = "md",
}: {
  message?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-[3px]",
    md: "w-12 h-12 border-[4px]",
    lg: "w-16 h-16 border-[5px]",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-3">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
         border-t-red-500
          border-r-yellow-500
          border-b-blue-500
          border-l-green-500
          animate-[spin_1s_linear_infinite]
          transition-colors
          duration-1000
        `}
      />
      {message && (
        <p className="text-center text-base font-medium text-white max-w-[200px]">
          {message}
        </p>
      )}
    </div>
  );
};

export default SecondaryLoader;
