import { twMerge } from "tailwind-merge";

/** Raw value is always without decimals */
export const rawValueToString = (rawValue: number | null) => {
  if (rawValue === null) {
    return null;
  }

  return (rawValue / 100).toString();
};

export const rawNumberToAmount = <T extends number | null>(rawNumber: T): T => {
  if (rawNumber === null) {
    return rawNumber;
  }

  return (rawNumber * 100) as T;
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
