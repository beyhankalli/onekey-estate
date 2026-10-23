import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  if (!user) return null;

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !adminUser) return null;

  return user;
}

export async function DELETE(request: Request) {
  try {
    // 1. Yetkilendirme Kontrolü ve aktif kullanıcı bilgisi alımı
    const currentUser = await isAuthenticatedAdmin();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    // 2. İstemciden silinecek agentId değerini al
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // 3. Supabase Service Role Client oluştur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error (missing service key). Check your .env file." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Ajan kaydını veritabanından çekip güvenilir auth_user_id değerini sunucuda al
    const { data: agentRecord, error: fetchError } = await supabaseAdmin
      .from("agents")
      .select("id, auth_user_id, user_id")
      .eq("id", agentId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching agent record:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch agent record: " + fetchError.message },
        { status: 500 }
      );
    }

    if (!agentRecord) {
      return NextResponse.json(
        { error: "Agent record not found" },
        { status: 404 }
      );
    }

    const targetAuthUserId = agentRecord.auth_user_id || agentRecord.user_id;

    // 5. Kendi aktif admin hesabını silmeyi engelle
    if (targetAuthUserId && targetAuthUserId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    // 6. Bağlı Auth hesabı ve Admin kaydı varsa onları temizle
    if (targetAuthUserId) {
      await supabaseAdmin
        .from("admin_users")
        .delete()
        .eq("user_id", targetAuthUserId);

      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetAuthUserId);

      if (authDeleteError) {
        console.error("Auth user deletion error:", authDeleteError);
        return NextResponse.json(
          { error: "Failed to delete associated Auth account: " + authDeleteError.message },
          { status: 500 }
        );
      }
    }

    // 7. agents tablosundan kaydı sil
    const { error: agentDeleteError } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", agentId);

    if (agentDeleteError) {
      console.error("Agent table deletion error:", agentDeleteError);
      return NextResponse.json(
        { error: "Failed to delete agent record: " + agentDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent record, admin assignment, and Auth account permanently deleted.",
    });

  } catch (error: any) {
    console.error("API error during agent deletion:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}