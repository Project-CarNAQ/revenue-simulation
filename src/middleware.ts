import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  const origin = request.headers.get("origin") || "";

  // Check origin against allowedOrigin (or allow all if wildcard)
  const isOriginAllowed = allowedOrigin === "*" || allowedOrigin === origin;
  const accessControlOrigin = isOriginAllowed ? (allowedOrigin === "*" ? "*" : origin) : allowedOrigin;

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": accessControlOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = request.headers.get("authorization");
  const xApiKey = request.headers.get("x-api-key");
  const cookieKey = request.cookies.get("carnaq_sim_key")?.value;
  const queryKey =
    request.nextUrl.searchParams.get("key") ||
    request.nextUrl.searchParams.get("api_key");
  const expectedApiKey = process.env.SIMULATION_API_KEY;

  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  } else if (cookieKey) {
    token = cookieKey.trim();
  } else if (queryKey) {
    token = queryKey.trim();
  }

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Unauthorized: Missing or malformed Authorization header. Expected 'Authorization: Bearer <key>', or append '?key=" +
          (expectedApiKey || "your_api_key") +
          "' to the URL in your browser.",
      },
      { status: 401, headers: corsHeaders }
    );
  }

  // If SIMULATION_API_KEY is not configured in environment, fail securely
  if (!expectedApiKey || token !== expectedApiKey) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API key." },
      { status: 401, headers: corsHeaders }
    );
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  // Store authentication cookie so direct browser tab navigation works
  response.cookies.set("carnaq_sim_key", token, {
    path: "/",
    maxAge: 86400 * 30, // 30 days
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
