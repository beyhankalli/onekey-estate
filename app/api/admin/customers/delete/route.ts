
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request) {
  try {
    // 1. Oturum doğrulaması
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized request." },
        { status: 401 }
      );
    }

    // 2. Admin yetkisini sunucu tarafında doğrula
    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin_user");

    if (adminError) {
      console.error("Admin authorization check failed:", adminError);

      return NextResponse.json(
        { error: "Unable to verify administrator access." },
        { status: 500 }
      );
    }

    if (isAdmin !== true) {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    // 3. İstek gövdesini ve müşteri ID'sini doğrula
    let body: { customerId?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const customerId = body?.customerId;

    if (
      typeof customerId !== "string" ||
      !UUID_REGEX.test(customerId)
    ) {
      return NextResponse.json(
        { error: "A valid customer ID is required." },
        { status: 400 }
      );
    }

    // 4. Service Role client yalnızca sunucuda oluşturulur
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server configuration is incomplete.");

      return NextResponse.json(
        { error: "Server configuration error." },
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

    // 5. Müşteri kaydını güvenilir kaynaktan bul
    const { data: customer, error: customerFetchError } =
      await supabaseAdmin
        .from("customers")
        .select("id, auth_user_id")
        .eq("id", customerId)
        .maybeSingle();

    if (customerFetchError) {
      console.error(
        "Customer lookup failed:",
        customerFetchError
      );

      return NextResponse.json(
        { error: "Unable to retrieve customer record." },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer record not found." },
        { status: 404 }
      );
    }

    // Admin'in kendi hesabının yanlışlıkla silinmesini önle
    if (customer.auth_user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account here." },
        { status: 403 }
      );
    }

    // 6. Müşterinin belgelerini sayfalayarak listele
    const bucket = supabaseAdmin.storage.from("customer-documents");
    const filePaths: string[] = [];
    const pageSize = 100;
    let offset = 0;

    while (true) {
      const { data: files, error: listError } = await bucket.list(
        customerId,
        {
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" },
        }
      );

      if (listError) {
        console.error("Customer files lookup failed:", listError);

        return NextResponse.json(
          { error: "Unable to prepare customer file deletion." },
          { status: 500 }
        );
      }

      const pageFiles = (files ?? []).filter(
        (file) => file.id !== null
      );

      filePaths.push(
        ...pageFiles.map((file) => `${customerId}/${file.name}`)
      );

      if (!files || files.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    // 7. Dosyaları sil; başarısızlığı sessizce geçme
    if (filePaths.length > 0) {
      const { error: storageDeleteError } =
        await bucket.remove(filePaths);

      if (storageDeleteError) {
        console.error(
          "Customer files deletion failed:",
          storageDeleteError
        );

        return NextResponse.json(
          { error: "Unable to delete customer files." },
          { status: 500 }
        );
      }
    }

    // 8. Müşteri kaydını sil
    const { data: deletedCustomers, error: customerDeleteError } =
      await supabaseAdmin
        .from("customers")
        .delete()
        .eq("id", customerId)
        .select("id");

    if (customerDeleteError) {
      console.error(
        "Customer record deletion failed:",
        customerDeleteError
      );

      return NextResponse.json(
        {
          error:
            "Customer record deletion failed. The Auth account was not deleted.",
        },
        { status: 500 }
      );
    }

    if (!deletedCustomers || deletedCustomers.length === 0) {
      return NextResponse.json(
        { error: "Customer record was not deleted." },
        { status: 409 }
      );
    }

    // 9. Bağlı Auth hesabını en son sil
    if (customer.auth_user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(
          customer.auth_user_id
        );

      if (authDeleteError) {
        console.error(
          "Auth account deletion failed after customer deletion:",
          authDeleteError
        );

        return NextResponse.json(
          {
            error:
              "Customer data was deleted, but the authentication account could not be deleted. Manual cleanup is required.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Customer record, linked Auth account, and listed files deleted.",
    });
  } catch (error: unknown) {
    console.error("Unexpected customer deletion error:", error);

    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
