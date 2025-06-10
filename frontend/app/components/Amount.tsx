import { twMerge } from "tailwind-merge";

/** Raw value is always without decimals */
export const rawValueToString = (rawValue: number | null) => {
  if (rawValue === null) {
    return null;
  }

  return (rawValue / 100).toString();
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
  hideSign,
}: {
  amount: number;
  className?: string;
  hideSign?: boolean;
}) {
  const dollars = amount / 100;

  return (
    <span className={twMerge(`text-sm`, className)}>
      {`${hideSign ? "" : "$ "}${dollars.toFixed(2)}`}
    </span>
  );
}
