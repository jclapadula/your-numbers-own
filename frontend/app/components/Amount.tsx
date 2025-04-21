import { twMerge } from "tailwind-merge";

export const rawStringToAmount = (rawString: string | null) => {
  if (rawString === null) {
    return null;
  }

  const amountAsNumber = Number(rawString) / 100;
  if (isNaN(amountAsNumber)) {
    return null;
  }

  return amountAsNumber;
};

export const rawNumberToAmount = (rawNumber: number | null) => {
  if (rawNumber === null) {
    return null;
  }
  return rawNumber * 100;
};

export default function Amount({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const dollars = amount / 100;

  return (
    <span className={twMerge(`text-sm`, className)}>
      {`$ ${dollars.toFixed(2)}`}
    </span>
  );
}
