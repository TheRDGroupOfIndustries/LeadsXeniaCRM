"use client";

import React from "react";

interface ToggleBtnProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({ checked, onCheckedChange }) => {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${
        checked ? "bg-green-500" : "bg-gray-400"
      }`}
    >
      <div
        className={`h-5 w-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
          checked ? "translate-x-7" : ""
        }`}
      ></div>
    </button>
  );
};

export default ToggleBtn;
