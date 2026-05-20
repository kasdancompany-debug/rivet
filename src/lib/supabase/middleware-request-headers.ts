import { type NextRequest, NextResponse } from "next/server"

/** Forward current path (+ query) to the server so layouts can build safe `login?next=` fallbacks. */
export function nextResponseCloningRequestWithReturnTo(
  request: NextRequest,
  returnTo: string
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-rivet-return-to", returnTo)
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}
