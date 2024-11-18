"use client";

import { searchSchema, TSearchSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "../ui/Button";

const Newsletter = () => {
  const { register, handleSubmit, reset } = useForm<TSearchSchema>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit = async (data: TSearchSchema) => {
    reset();
  };

  return (
    <section className="w-full overflow-hidden">
      <div className="bg-accent p-16 rounded-lg flex items-center justify-between m:flex-col m:p-8 xl:flex-col xl:p-8 xl:items-start">
        <h1 className="text-secondary leading-tight font-semibold m:text-xl">
          Stay informed <br />
          Receive the latest updates
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-end gap-3 m:items-center m:mt-8 xl:items-start xl:mt-8"
        >
          <div className="flex items-center gap-3 m:flex-col m:w-full xl:w-full">
            <div className="bg-secondary opacity-50 p-3 rounded-lg m:w-full">
              <input
                {...register("query")}
                className="placeholder:font-medium bg-transparent text-white focus:outline-none m:w-full xl:w-fit"
                placeholder="Enter your e-mail"
                type="email"
                inputMode="email"
              />
            </div>
            <Button
              text="Sign up"
              style="bg-white p-4 rounded-md text-secondary transition font-semibold hover:transition-[3s] hover:bg-abstract hover:text-white m:w-full xl:w-max"
              type="submit"
            />
          </div>
          <p className="text-sm text-secondary w-[32rem] m:w-fit xl:w-fit">
            By clicking send, you will receive occasional emails from Hazee. You
            can always choose to unsubscribe in any email you receive.
          </p>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
