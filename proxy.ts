import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    return supabaseResponse;
  }

  if (!pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("redirect", pathname);

    return NextResponse.redirect(url);
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_admin_user"
  );

  if (adminError) {
    console.error("Admin authorization check failed:", adminError);

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  if (!isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};