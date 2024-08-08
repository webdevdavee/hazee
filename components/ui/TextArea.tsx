type Props = {
  inputRegister?: any;
  label: string;
  htmlFor: string;
  inputType: string;
  error?: any;
  placeholder?: string;
  required?: boolean;
  inputMode?: string;
  style?: string;
};

const TextArea: React.FC<Props> = ({
  inputRegister,
  label,
  htmlFor,
  inputType,
  error,
  placeholder,
  required,
  inputMode,
  style,
}) => {
  return (
    <section className="w-full flex flex-col gap-3">
      <label className="flex gap-1 font-medium" htmlFor={htmlFor}>
        {label}
        <p>{required ? "*" : "(Optional)"}</p>
      </label>
      <div className="border-[1px] border-secondary py-2 px-4 rounded-md">
        <textarea
          {...inputRegister}
          className={`w-full placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none ${style}`}
          type={inputType}
          id={htmlFor}
          placeholder={placeholder}
          inputMode={inputMode}
        />
      </div>
      {error}
    </section>
  );
};

export default TextArea;
