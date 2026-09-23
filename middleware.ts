import { NextRequest, NextResponse } from "next/server";

// حماية مسارات /dashboard على مستوى الميدل وير — تحقق أولي سريع بوجود التوكن.
// الحماية الحقيقية والنهائية دايمًا في الباك إند (كل endpoint بيتحقق من التوكن بنفسه).
function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("qs_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = decodeRole(token);
    const segments = pathname.split("/").filter(Boolean); // ["dashboard", "admin", ...]
    const requestedRole = segments[1];

    if (requestedRole && ["admin", "teacher", "student"].includes(requestedRole) && role !== requestedRole) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
