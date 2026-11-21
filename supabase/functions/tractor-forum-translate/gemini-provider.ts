/**
 * Bounded direct Gemini generateContent adapter.
 * Google REST docs: /v1beta/models/{model}:generateContent,
 * generationConfig.responseMimeType/responseJsonSchema, candidates[].finishReason.
 *
 * Important: DO NOT use long-lived Interactions polling in the synchronous
 * Supabase Edge HTTP request. Its 150s request idle limit is not a job timeout.
 *
 * No credentials, source body or raw provider output are logged.
 */
export type GeminiJsonResult = {value: Record<string, unknown>; model: string};
type Fetcher = typeof fetch;

const API = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash"] as const;
const TIMEOUTS_MS = [28000, 22000] as const;
const TRANSIENT = new Set([429, 500, 502, 503, 504]);

export function requestBody(prompt: string, schema: Record<string, unknown>, review=false) {
 if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 14000)
  throw Error("Invalid bounded Gemini prompt");
 return {
  contents: [{role: "user", parts: [{text: prompt}]}],
  generationConfig: {
   temperature: 0.1,
   maxOutputTokens: review ? 1024 : 4608,
   responseMimeType: "application/json",
   responseJsonSchema: schema,
   thinkingConfig: {thinkingLevel: "MINIMAL"}
  }
 };
}

export async function generateGeminiJson({
 apiKey, prompt, schema, deadline=Date.now()+108000,
 review=false, fetchFn=fetch
}: {
 apiKey:string; prompt:string; schema:Record<string, unknown>;
 deadline?:number;review?:boolean;fetchFn?:Fetcher
}): Promise<GeminiJsonResult> {
 if (!apiKey) throw Error("Gemini provider credentials unavailable");
 const body = JSON.stringify(requestBody(prompt, schema, review));
 for (let i=0;i<MODELS.length;i++) {
  const remaining = deadline-Date.now()-4000;
  if (remaining < 6000) throw Error("Gemini request budget exhausted");
  const timeout = Math.min(remaining, TIMEOUTS_MS[i]);
  let response: Response;
  try {
   response = await fetchFn(API+MODELS[i]+":generateContent", {
    method:"POST",
    headers:{"content-type":"application/json","x-goog-api-key":apiKey},
    body, signal:AbortSignal.timeout(timeout)
   });
  } catch {
   if (i===0) continue;
   throw Error("Gemini provider request timeout");
  }
  if (!response.ok) {
   // Do not retry auth, invalid model/schema, or policy violations.
   if (i===0 && TRANSIENT.has(response.status)) continue;
   throw Error("Gemini provider HTTP "+response.status);
  }
  let data: any;
  try {data=await response.json()} catch {
   if (i===0) continue;
   throw Error("Gemini provider response JSON invalid");
  }
  const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : null;
  const reason = String(candidate?.finishReason||"");
  if (reason !== "STOP") {
   if (i===0 && (reason==="MAX_TOKENS" || reason==="OTHER" || !reason)) continue;
   throw Error("Gemini finish reason "+(reason||"missing"));
  }
  const text = (candidate?.content?.parts||[])
   .filter((part: any)=>typeof part?.text==="string")
   .map((part: any)=>part.text).join("").trim();
  if (!text || text.length > 35000) {
   if (i===0) continue;
   throw Error("Gemini text absent or too long");
  }
  let parsed: unknown;
  try {parsed=JSON.parse(text)} catch {
   if (i===0) continue;
   throw Error("Gemini structured output malformed");
  }
  if (!parsed || typeof parsed!=="object" || Array.isArray(parsed))
   throw Error("Gemini structured output is not an object");
  return {value:parsed as Record<string,unknown>,model:MODELS[i]};
 }
 throw Error("Gemini approved models unavailable");
}
