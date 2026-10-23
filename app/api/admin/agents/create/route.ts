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

  if (!user) return false;

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !error && Boolean(adminUser);
}

export async function POST(request: Request) {
  try {
    // 1. Yetkilendirme Kontrolü (İsteği yapan kullanıcının yetkisi doğrulanır)
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    // 2. İstemciden gelen verileri al
    const body = await request.json();
    const { email, password, name, fullName, phone, title, bio } = body;

    const agentName = name || fullName;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 3. Supabase Service Role Client oluştur (Oturum açmış admin kullanıcısının oturumunu etkilemeden işlem yapmak için)
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

    // 4. Sunucu tarafında yeni Supabase Auth kullanıcısı oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: agentName,
        role: "agent",
      },
    });

    if (authError || !authData.user) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        { error: "Failed to create Auth account: " + (authError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // 5. 1:1 İlkesi Gereği: "agents" tablosuna ajan kaydını ekle
    const agentData: Record<string, any> = {
      user_id: newUserId,
      email,
    };

    if (agentName) agentData.name = agentName;
    if (phone) agentData.phone = phone;
    if (title) agentData.title = title;
    if (bio) agentData.bio = bio;

    const { error: agentInsertError } = await supabaseAdmin
      .from("agents")
      .insert(agentData);

    if (agentInsertError) {
      console.error("Agents table insert error:", agentInsertError);
      // Yetim Auth kaydı oluşmaması için Auth kullanıcısını geri sil
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: "Failed to create agent record: " + agentInsertError.message },
        { status: 500 }
      );
    }

    // 6. 1:1 İlkesi Gereği: "admin_users" tablosuna admin kaydını ekle (Her Ajan bir Admin'dir)
    const { error: adminInsertError } = await supabaseAdmin
      .from("admin_users")
      .insert({ user_id: newUserId });

    if (adminInsertError) {
      console.error("Admin users table insert error:", adminInsertError);
      // Yetim kayıt oluşmaması için hem agent kaydını hem auth kullanıcısını geri sil
      await supabaseAdmin.from("agents").delete().eq("user_id", newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: "Failed to create admin record: " + adminInsertError.message },
        { status: 500 }
      );
    }

    // 7. Başarılı yanıt dön
    return NextResponse.json({
      success: true,
      message: "Agent and Admin records successfully created.",
      user: {
        id: newUserId,
        email,
        name: agentName,
      },
    });

  } catch (error: any) {
    console.error("API error during agent creation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}