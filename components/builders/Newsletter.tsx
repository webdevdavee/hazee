"use client";

import { searchSchema, TSearchSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "../ui/Button";
import { MdEmail } from "react-icons/md";

const Newsletter = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TSearchSchema>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit = async (data: TSearchSchema) => {
    // Implement newsletter signup logic
    console.log(data);
    reset();
  };

  return (
    <section className="w-full px-4 py-16 m:py-8">
      <div className="max-w-4xl mx-auto bg-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-12 m:p-6 flex items-center m:flex-col justify-between">
          <div className="flex items-center space-x-6 m:flex-col m:space-x-0 m:space-y-4 m:text-center">
            <MdEmail
              className="text-accent w-16 h-16 m:w-12 m:h-12"
              // strokeWidth={1.5}
            />
            <div>
              <h2 className="text-3xl m:text-2xl font-bold text-zinc-100 mb-3">
                Stay Updated
              </h2>
              <p className="text-zinc-400 max-w-md m:text-sm m:mb-5">
                Subscribe to our newsletter and get the latest updates,
                insights, and exclusive content.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col space-y-3 w-96 m:w-full"
          >
            <div className="relative">
              <input
                {...register("query")}
                className="
                  w-full 
                  bg-zinc-700 
                  text-white 
                  px-4 
                  py-3 
                  rounded-lg 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-accent 
                  transition-all
                  duration-300
                  border
                  border-transparent
                "
                placeholder="Enter your email address"
                type="email"
                inputMode="email"
              />
              {errors.query && (
                <p className="text-red-500 text-sm mt-1 absolute">
                  {errors.query.message as string}
                </p>
              )}
            </div>

            <Button
              text="Subscribe"
              style="
                w-full 
                bg-accent 
                text-white 
                py-3 
                rounded-lg 
                font-semibold 
                hover:bg-opacity-90 
                transition-colors 
                duration-300
              "
              type="submit"
            />

            <p className="text-xs text-zinc-500 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
