// -----------------------------------------------------------------------------
// withApi — schlanker Wrapper für App-Router-Route-Handler
// -----------------------------------------------------------------------------
// Bündelt, was bisher in jeder `route.ts` von Hand wiederholt wurde:
//  - try/catch + `handleApiError` (Zod -> 400, Prisma P2025 -> 404, ...)
//  - optionales Rate-Limiting (`createApiRateLimiter`, siehe apiRateLimit.ts)
//  - JSON-Body lesen + mit Zod validieren (`readJson`): ein kaputter Body ergibt
//    jetzt 400 statt eines 500er-Fehlers durch den rohen `SyntaxError`.
//
// Bewusst klein gehalten und abwärtskompatibel: Handler behalten ihre
// Signatur (Request, Kontext mit `params`), liefern weiterhin eine Response
// und können schrittweise migriert werden.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { handleApiError } from "@/lib/core/apiUtils";

/** Wird geworfen, wenn der Request-Body kein gültiges JSON ist (-> HTTP 400). */
export class InvalidJsonError extends Error {
  constructor() {
    super("Ungültiger JSON-Body");
    this.name = "InvalidJsonError";
  }
}

/** Liest den Body als JSON und validiert ihn mit `schema` (wirft `ZodError` bzw. `InvalidJsonError`). */
export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InvalidJsonError();
  }
  return schema.parse(body);
}

type RouteContext<P> = { params: Promise<P> };
type RateLimiter = (request: NextRequest) => NextResponse | null;

export interface WithApiOptions {
  /** Rate-Limiter aus `createApiRateLimiter()`, am Modul-Scope der Route erzeugt. */
  rateLimit?: RateLimiter;
}

/**
 * ```ts
 * export const POST = withApi(async (request) => {
 *   const data = await readJson(request, mySchema);
 *   return NextResponse.json(await create(data), { status: 201 });
 * });
 *
 * export const PATCH = withApi<{ id: string }>(async (request, { params }) => {
 *   const { id } = await params;
 *   ...
 * });
 * ```
 */
export function withApi<P = Record<string, never>>(
  handler: (request: NextRequest, context: RouteContext<P>) => Promise<Response> | Response,
  options: WithApiOptions = {},
) {
  return async function route(request: NextRequest, context: RouteContext<P>): Promise<Response> {
    try {
      const limited = options.rateLimit?.(request);
      if (limited) return limited;
      return await handler(request, context);
    } catch (error) {
      if (error instanceof InvalidJsonError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return handleApiError(error);
    }
  };
}
