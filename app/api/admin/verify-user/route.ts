import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, type, verify } = body;

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        { success: false, error: "Customer ID is required." },
        { status: 400 }
      );
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json(
        { success: false, error: "Invalid verification type." },
        { status: 400 }
      );
    }

    if (typeof verify !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Verification status must be true or false." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Supabase server environment variables.",
        },
        { status: 500 }
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

    // Find the public customer record first.
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
        { success: false, error: "Customer record not found." },
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

    /*
     * EMAIL VERIFICATION
     *
     * public.customers.id and auth.users.id are different IDs.
     *
     * First try the stored auth_user_id.
     * If that does not point to an existing Auth user,
     * find the Auth user using the customer's email address.
     */

    let authUserId = customer.auth_user_id as string | null;

    if (authUserId) {
      const { data: existingAuthUser } =
        await supabaseAdmin.auth.admin.getUserById(authUserId);

      if (!existingAuthUser?.user) {
        authUserId = null;
      }
    }

    // Fallback: find the Auth account by email.
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
        (user) => user.email?.trim().toLowerCase() === targetEmail
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

    // Confirm/unconfirm the actual Auth email.
    const { error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(
        authUserId,
        {
          email_confirm: verify,
        }
      );

    if (authError) {
      throw authError;
    }

    // Synchronise the customer record with Auth.
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
  } catch (error: any) {
    console.error("Admin Verify Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Verification update failed.",
      },
      { status: 500 }
    );
  }
}