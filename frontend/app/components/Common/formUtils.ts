import { z } from "zod";

export const toObjectErrors = <TShape extends object>(
  error: z.ZodError<TShape>
) => {
  const errorsByField = error.flatten().fieldErrors;

  const singleErrorByField = {} as Partial<Record<keyof TShape, string>>;
  for (const key of Object.keys(errorsByField) as Array<keyof TShape>) {
    singleErrorByField[key] = errorsByField[key]?.join("\n");
  }

  return singleErrorByField;
};
