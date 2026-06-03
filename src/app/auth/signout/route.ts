import { NextResponse } from "next/server";
import { getAuthService } from "@/modules/auth";

export async function POST(request: Request) {
  const auth = await getAuthService();
  await auth.logout();
  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}
