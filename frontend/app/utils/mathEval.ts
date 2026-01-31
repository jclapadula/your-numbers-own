function evaluateMathExpression(expression: string): number | null {
  const trimmedExpression = expression.trim();

  if (!trimmedExpression) {
    return null;
  }

  const hasMathOperators = /[+\-*/]/.test(trimmedExpression);
  if (!hasMathOperators) {
    return null;
  }

  const sanitizedExpression = trimmedExpression.replace(/[^0-9+\-*/.()]/g, "");

  if (sanitizedExpression !== trimmedExpression) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${sanitizedExpression})`)();

    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return Number(result.toFixed(2));
    }

    return null;
  } catch {
    return null;
  }
}

export function evaluateMathInput(
  input: string,
  fallbackValue: number,
): number {
  const evaluated = evaluateMathExpression(input);
  if (evaluated !== null) {
    return evaluated;
  }

  const parsed = Number(input);
  if (!isNaN(parsed)) {
    return Number(parsed.toFixed(2));
  }

  return fallbackValue;
}
