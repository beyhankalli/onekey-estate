import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    // 1. Yetkilendirme Kontrolü (İsteği yapan kişi sistemde login olmuş yetkili bir admin mi?)
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // 4. Storage üzerindeki customer-documents klasöründen müşteri dosyalarını temizle
    try {
      const { data: filesList, error: listError } = await supabaseAdmin.storage
        .from("customer-documents")
        .list(customerId);

      if (!listError && filesList && filesList.length > 0) {
        const filePaths = filesList.map((file) => `${customerId}/${file.name}`);
        await supabaseAdmin.storage
          .from("customer-documents")
          .remove(filePaths);
      }
    } catch (storageErr) {
      console.error("Error deleting customer storage files:", storageErr);
    }

    // 5. Önce Auth Kullanıcısını Sil (Eğer bağlı bir Auth hesabı varsa)
    if (authUserId) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      
      if (authDeleteError) {
        console.error("Auth user deletion error:", authDeleteError);
        return NextResponse.json(
          { error: "Failed to delete Supabase Auth account: " + authDeleteError.message }, 
          { status: 500 }
        );
      }
    }

    // 6. Müşteri Tablosundaki Kaydı Sil
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

    // 7. Başarılı yanıt dön
    return NextResponse.json({ 
      success: true, 
      message: "Customer record, Auth account, and storage files permanently deleted." 
    });

  } catch (error: any) {
    console.error("API error during customer deletion:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}