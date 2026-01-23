import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "shared";
import { Money } from "shared";

interface DecimalTestResult {
  jsCalculation: { input: string; result: number; correct: boolean };
  moneyCalculation: { input: string; result: string; correct: boolean };
  depreciationExample: {
    purchaseValue: string;
    usefulLifeMonths: number;
    monthlyDepreciation: string;
  };
}

export function DecimalDemo() {
  const [serverData, setServerData] = useState<DecimalTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side calculation for comparison
  const clientMoney = {
    a: new Money("0.1"),
    b: new Money("0.2"),
  };
  const clientResult = clientMoney.a.plus(clientMoney.b);

  const fetchDecimalTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/health/decimal-test");
      const data: ApiResponse<DecimalTestResult> = await response.json();
      if (data.success && data.data) {
        setServerData(data.data);
      } else {
        setError(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">MiFix - Phase 1 Integration Test</h1>

      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Client-Side Calculation</h2>
        <p className="text-sm text-gray-600">
          Using Money class directly in browser:
        </p>
        <code className="block bg-gray-100 p-2 rounded">
          0.1 + 0.2 = {clientResult.toDisplay()}
        </code>
        <p
          className={
            clientResult.toDisplay() === "0.30"
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {clientResult.toDisplay() === "0.30" ? "Correct!" : "Incorrect!"}
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Server-Side Calculation</h2>
        <Button onClick={fetchDecimalTest} disabled={loading}>
          {loading ? "Loading..." : "Fetch from API"}
        </Button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {serverData && (
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded">
              <h3 className="font-medium">JavaScript Native (incorrect)</h3>
              <code>
                {serverData.jsCalculation.input} ={" "}
                {serverData.jsCalculation.result}
              </code>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <h3 className="font-medium">Money Class (correct)</h3>
              <code>
                {serverData.moneyCalculation.input} ={" "}
                {serverData.moneyCalculation.result}
              </code>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <h3 className="font-medium">Depreciation Example</h3>
              <p>
                Purchase Value: {serverData.depreciationExample.purchaseValue}{" "}
                RON
              </p>
              <p>
                Useful Life: {serverData.depreciationExample.usefulLifeMonths}{" "}
                months
              </p>
              <p>
                Monthly Depreciation:{" "}
                {serverData.depreciationExample.monthlyDepreciation} RON
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold">Phase 1 Checklist</h2>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-green-600">&#10003;</span>
            bhvr template initialized
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">&#10003;</span>
            Shared types working (ApiResponse imported)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">&#10003;</span>
            Money class works client-side
          </li>
          <li className="flex items-center gap-2">
            <span className={serverData ? "text-green-600" : "text-gray-400"}>
              {serverData ? "\u2713" : "\u25CB"}
            </span>
            API returns correct decimal values
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">&#10003;</span>
            shadcn/ui Button component renders
          </li>
        </ul>
      </div>
    </div>
  );
}
