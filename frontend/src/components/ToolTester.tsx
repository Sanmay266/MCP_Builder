"use client";

import React, { useState } from "react";
import { Play, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ToolTesterProps {
  projectId: number;
  tool: {
    id: number;
    name: string;
    description?: string;
    input_schema?: any;
    handler_type: string;
  };
}

export function ToolTester({ projectId, tool }: ToolTesterProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const properties = tool.input_schema?.properties || {};
  const required = tool.input_schema?.required || [];

  async function handleTest() {
    setTesting(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/projects/${projectId}/tools/${tool.id}/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to execute tool",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Test Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Fields */}
          {Object.keys(properties).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(properties).map(([key, prop]: [string, any]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {key}
                    {required.includes(key) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <Input
                    placeholder={prop.description || `Enter ${key}`}
                    value={inputs[key] || ""}
                    onChange={(e) =>
                      setInputs({ ...inputs, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This tool has no input parameters
            </p>
          )}

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Tool
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card
          className={`${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          } border-gray-200 dark:border-gray-800`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <CardTitle
                  className={`text-sm ${
                    result.success
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {result.success ? "✓ Success" : "✗ Error"}
                </CardTitle>
              </div>
              {result.execution_time_ms !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {result.execution_time_ms}ms
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result.errors ? (
              <div className="space-y-2">
                {result.errors.map((error: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
                  >
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-sm overflow-auto max-h-48 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                {typeof result.output === "string"
                  ? result.output
                  : JSON.stringify(result.output || result.error, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
