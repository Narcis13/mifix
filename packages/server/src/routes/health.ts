import { Hono } from "hono";
import type { ApiResponse } from "shared";
import { Money } from "shared";

const healthRoutes = new Hono();

// Basic health check
healthRoutes.get("/", (c) => {
  return c.json<ApiResponse<{ status: string; timestamp: string }>>({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// Decimal precision test endpoint
// This proves the Money class and decimal handling work correctly
healthRoutes.get("/decimal-test", (c) => {
  // The classic floating point problem
  const jsResult = 0.1 + 0.2; // Returns 0.30000000000000004

  // Using Money class
  const a = new Money("0.1");
  const b = new Money("0.2");
  const moneyResult = a.plus(b);

  // Monthly depreciation calculation example
  const purchaseValue = new Money("120000.00");
  const usefulLifeMonths = 60; // 5 years
  const monthlyDepreciation = purchaseValue.dividedBy(usefulLifeMonths);

  return c.json<
    ApiResponse<{
      jsCalculation: { input: string; result: number; correct: boolean };
      moneyCalculation: { input: string; result: string; correct: boolean };
      depreciationExample: {
        purchaseValue: string;
        usefulLifeMonths: number;
        monthlyDepreciation: string;
      };
    }>
  >({
    success: true,
    data: {
      jsCalculation: {
        input: "0.1 + 0.2",
        result: jsResult,
        correct: jsResult === 0.3, // false!
      },
      moneyCalculation: {
        input: "0.1 + 0.2",
        result: moneyResult.toDisplay(),
        correct: moneyResult.toDisplay() === "0.30", // true!
      },
      depreciationExample: {
        purchaseValue: purchaseValue.toDisplay(),
        usefulLifeMonths,
        monthlyDepreciation: monthlyDepreciation.toDisplay(),
      },
    },
  });
});

export { healthRoutes };
