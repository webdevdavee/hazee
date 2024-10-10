import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { traitSchema, TraitSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type Props = {
  onAddTrait: (data: Trait) => void;
  onEditTrait: (data: TraitSchema) => void;
  initialValue: Trait | undefined;
  isEditingTrait: boolean;
  traits: Trait[];
};

const AddTraitForm: React.FC<Props> = ({
  onAddTrait,
  onEditTrait,
  initialValue,
  isEditingTrait,
  traits,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TraitSchema>({
    resolver: zodResolver(traitSchema),
    defaultValues: { ...initialValue },
  });

  const onSubmit = (data: TraitSchema) => {
    const newId = traits.length <= 0 ? 1 : traits[traits.length - 1].id + 1;
    if (!isEditingTrait) {
      onAddTrait({ ...data, id: newId });
    } else {
      onEditTrait(data);
    }

    reset();
  };

  return (
    <div onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center gap-3">
        <TextInput
          inputRegister={register("type")}
          label="Type"
          htmlFor="type"
          inputType="text"
          placeholder="E.g. Size"
          required
          error={
            errors.type && <p className="text-red-500">{errors.type.message}</p>
          }
        />
        <TextInput
          inputRegister={register("value")}
          label="Value"
          htmlFor="value"
          inputType="text"
          placeholder="E.g. Medium"
          required
          error={
            errors.value && (
              <p className="text-red-500">{errors.value.message}</p>
            )
          }
        />
      </div>
      <Button
        text={!isEditingTrait ? "Add" : "Edit"}
        type="button"
        style="bg-primary w-full mt-8"
        onclick={handleSubmit(onSubmit)}
      />
    </div>
  );
};

export default AddTraitForm;
