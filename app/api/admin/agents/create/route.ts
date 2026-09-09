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

export async function DELETE(request: Request) {
  try {
    // 1. Yetkilendirme Kontrolü (Gerçek admin / agent yetkisi doğrulandı)
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
    }

    // 2. Request body'den müşteri ID ve Auth ID'sini al
    const { customerId, authUserId } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // 3. Supabase Service Role Client oluştur (RLS atlamak ve Auth.users yönetimi için)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error (missing service key). Check your .env file." }, 
        { status: 500 }
      );
    }

    // Admin yetkilerine sahip özel client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Önce Auth Kullanıcısını Sil (Eğer bağlı bir Auth hesabı varsa)
    if (authUserId) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      
      // Eğer Auth silinirken hata çıkarsa işlemi durdur (Orphan kayıt oluşmasını engellemek için)
      if (authDeleteError) {
        console.error("Auth user deletion error:", authDeleteError);
        return NextResponse.json(
          { error: "Failed to delete Supabase Auth account: " + authDeleteError.message }, 
          { status: 500 }
        );
      }
    }

    // 5. Müşteri Tablosundaki Kaydı Sil
    const { error: customerDeleteError } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (customerDeleteError) {
      console.error("Customer record deletion error:", customerDeleteError);
      return NextResponse.json(
        { error: "Failed to delete customer record: " + customerDeleteError.message }, 
        { status: 500 }
      );
    }

    // 6. Başarılı yanıt dön
    return NextResponse.json({ 
      success: true, 
      message: "Customer record and Auth account permanently deleted." 
    });

  } catch (error: any) {
    console.error("API error during customer deletion:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}