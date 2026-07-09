import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore Deno is available in Supabase Edge Runtime only
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ISSUE_TYPES = [
  "turbo_issue",
  "injector_noise",
  "timing_chain_noise",
  "engine_knocking",
  "idle_instability",
];

const SEVERITY_MAP: Record<string, string> = {
  normal_engine: "low",
  suspicious_noise: "medium",
  anomaly_detected: "high",
};

const RECOMMENDATIONS: Record<string, string> = {
  normal_engine: "Engine sounds healthy. Continue regular maintenance as scheduled.",
  suspicious_noise: "We recommend a mechanical inspection within 7 days to check the detected noise source.",
  anomaly_detected: "Engine knocking detected. Stop driving and have a professional inspection immediately.",
};

function analyze() {
  const rand = Math.random();
  let result: string;
  if (rand < 0.4) result = "normal_engine";
  else if (rand < 0.75) result = "suspicious_noise";
  else result = "anomaly_detected";

  const confidence = result === "normal_engine"
    ? 0.7 + Math.random() * 0.25
    : result === "suspicious_noise"
    ? 0.55 + Math.random() * 0.35
    : 0.75 + Math.random() * 0.2;

  const issueType = result === "normal_engine"
    ? null
    : ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];

  return {
    status: "ok",
    result,
    type: issueType,
    confidence: Math.round(confidence * 100) / 100,
    severity: SEVERITY_MAP[result],
    recommendation: RECOMMENDATIONS[result],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500));

    const result = analyze();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error", message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
