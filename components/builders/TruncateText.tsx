"use client";

import React from "react";

const TruncateText: React.FC<TruncateTextProps> = ({
  text,
  maxChars,
  className = "",
}) => {
  const [isTruncated, setIsTruncated] = React.useState(true);

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  const displayText =
    isTruncated && text.length > maxChars
      ? text.slice(0, maxChars) + "..."
      : text;

  return (
    <div className={className}>
      <p>
        {displayText}{" "}
        {text.length > maxChars && (
          <button
            onClick={toggleTruncate}
            className="text-white font-medium mt-2 focus:outline-none"
          >
            {isTruncated ? "See More" : "See Less"}
          </button>
        )}
      </p>
    </div>
  );
};

export default TruncateText;
