import React from "react";
import TextInput from "../ui/TextInput";
import { FieldErrors, UseFormRegister } from "react-hook-form";

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors<{
    username: string;
    email: string;
  }>;
};

const EditProfileFormFields: React.FC<Props> = ({ register, errors }) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <TextInput
        inputRegister={register("username")}
        label="Username"
        htmlFor="username"
        inputType="text"
        placeholder="Username"
        required
        style="lowercase placeholder:first-letter:uppercase"
        error={
          errors.username && (
            <p className="text-red-500">{errors.username.message}</p>
          )
        }
      />
      <TextInput
        inputRegister={register("email")}
        label="Email"
        htmlFor="email"
        inputType="email"
        placeholder="email"
        required
        error={
          errors.email && <p className="text-red-500">{errors.email.message}</p>
        }
      />
    </div>
  );
};

export default EditProfileFormFields;
