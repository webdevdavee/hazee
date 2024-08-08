"use client";

import { searchSchema, TSearchSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { FaSearch } from "react-icons/fa";

type Props = {
  placeholder: string;
};

const Searchbar: React.FC<Props> = ({ placeholder }) => {
  const { register, handleSubmit, reset } = useForm<TSearchSchema>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit = async (data: TSearchSchema) => {
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-secondary py-2 pl-4 pr-3 rounded-full flex items-center gap-3">
        <input
          {...register("query")}
          className="placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none"
          placeholder={placeholder}
        />
        <FaSearch color="gray" />
      </div>
    </form>
  );
};

export default Searchbar;
