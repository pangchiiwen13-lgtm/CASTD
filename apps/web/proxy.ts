import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy is a passthrough - actual auth checks happen inside each page/layout.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
