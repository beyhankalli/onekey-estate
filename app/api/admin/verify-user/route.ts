import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Supabase server environment variables.",
        },
        { status: 500 }
      );
    }

    const cookieHeader = request.headers.get("cookie") ?? "";

    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");

        if (separatorIndex === -1) {
          return null;
        }

        const name = cookie.slice(0, separatorIndex);
        const value = cookie.slice(separatorIndex + 1);

        return {
          name,
          value: decodeURIComponent(value),
        };
      })
      .filter(
        (cookie): cookie is { name: string; value: string } =>
          cookie !== null
      );

    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookies;
          },
          setAll() {
            // This route does not need to modify auth cookies.
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const { data: isAdmin, error: adminError } =
      await supabaseAuth.rpc("is_admin_user");

    if (adminError) {
      console.error("Admin authorization check failed:", adminError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify administrator access.",
        },
        { status: 500 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator access required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { customerId, type, verify } = body;

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID is required.",
        },
        { status: 400 }
      );
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification type.",
        },
        { status: 400 }
      );
    }

    if (typeof verify !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Verification status must be true or false.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, auth_user_id, email")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer record not found.",
        },
        { status: 404 }
      );
    }

    if (type === "phone") {
      const { error: dbError } = await supabaseAdmin
        .from("customers")
        .update({
          phone_verified: verify,
        })
        .eq("id", customerId);

      if (dbError) {
        throw dbError;
      }

      return NextResponse.json({
        success: true,
        type: "phone",
        verified: verify,
      });
    }

    let authUserId = customer.auth_user_id as string | null;

    if (authUserId) {
      const { data: existingAuthUser, error: existingAuthUserError } =
        await supabaseAdmin.auth.admin.getUserById(authUserId);

      if (existingAuthUserError || !existingAuthUser?.user) {
        authUserId = null;
      }
    }

    if (!authUserId && customer.email) {
      const targetEmail = customer.email.trim().toLowerCase();

      const { data: usersData, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (usersError) {
        throw usersError;
      }

      const matchingUser = usersData.users.find(
        (authUser) =>
          authUser.email?.trim().toLowerCase() === targetEmail
      );

      if (matchingUser) {
        authUserId = matchingUser.id;
      }
    }

    if (!authUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No Supabase Auth account could be found for this customer email address.",
        },
        { status: 404 }
      );
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        email_confirm: verify,
      });

    if (authError) {
      throw authError;
    }

    const { error: dbError } = await supabaseAdmin
      .from("customers")
      .update({
        email_verified: verify,
        auth_user_id: authUserId,
      })
      .eq("id", customerId);

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      type: "email",
      verified: verify,
    });
  } catch (error: unknown) {
    console.error("Admin Verify Error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Verification update failed.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}