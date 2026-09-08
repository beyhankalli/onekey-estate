import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

async function isAuthenticatedAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !error && Boolean(adminUser);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;
  let createdAgentId: string | null = null;

  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const photo = typeof body.photo === "string" ? body.photo.trim() : "";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Agent name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Agent email is required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    // Create the Auth account directly from the server.
    // Email is confirmed immediately because the password is set by an existing admin.
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          phone: phone || null,
          account_type: "agent",
        },
      });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Supabase Auth account could not be created.");
    }

    createdAuthUserId = authData.user.id;

    // Every agent is also an approved admin for the OneKey portal.
    const { error: adminError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        user_id: createdAuthUserId,
      });

    if (adminError) {
      throw adminError;
    }

    // Create the public agent profile and link it to the Auth account.
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert({
        auth_user_id: createdAuthUserId,
        name,
        email,
        phone: phone || null,
        whatsapp: whatsapp || null,
        bio: bio || null,
        photo: photo || null,
      })
      .select("id, name, email, phone, whatsapp, bio, photo, created_at, auth_user_id")
      .single();

    if (agentError) {
      throw agentError;
    }

    createdAgentId = agentData.id;

    return NextResponse.json({
      success: true,
      agent: agentData,
      message: "Agent account and profile created successfully.",
    });
  } catch (error: any) {
    const supabaseAdmin = (() => {
      try {
        return getAdminClient();
      } catch {
        return null;
      }
    })();

    // Roll back partially-created records so failed account creation does not leave orphaned Auth users.
    if (supabaseAdmin) {
      if (createdAgentId) {
        await supabaseAdmin.from("agents").delete().eq("id", createdAgentId);
      }

      if (createdAuthUserId) {
        await supabaseAdmin
          .from("admin_users")
          .delete()
          .eq("user_id", createdAuthUserId);

        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      }
    }

    console.error("Admin create agent error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unable to create agent account.",
      },
      { status: 500 }
    );
  }
}
