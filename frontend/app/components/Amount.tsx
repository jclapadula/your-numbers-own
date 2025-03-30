export default function Amount({ amount }: { amount: number }) {
  const dollars = amount / 100;
  return <span className="text-sm">{`$ ${dollars.toFixed(2)}`}</span>;
}
