import { NextResponse } from 'next/server';

// Ziyaretçi formu doldurduğunda bu POST fonksiyonu çalışır
export async function POST(request: Request) {
  try {
    // 1. Ziyaretçinin formdan gönderdiği verileri (JSON) alıyoruz
    const body = await request.json();
    const { name, email, phone, message } = body;

    // 2. Hedef e-posta adresimiz (Senin belirlediğin kurumsal domain)
    const TARGET_EMAIL = "info@onekey.co.uk";

    // 3. EĞİTİM NOTU: Gerçek e-posta gönderim kodu ileride buraya gelecek.
    // Domain aktif edildiğinde sistem şu mantıkla çalışacak:
    /*
      await emailService.send({
        to: TARGET_EMAIL,
        subject: `New Contact Form Message from ${name}`,
        html: `<p>Name: ${name}</p><p>Contact: ${email || phone}</p><p>Message: ${message}</p>`
      });
    */
    
    // Şimdilik sistemin çalıştığını sunucu konsolunda test ediyoruz
    console.log(`[E-MAIL SİSTEMİ BAŞARILI] Mesaj ${TARGET_EMAIL} adresine yönlendirilecek.`);
    console.log(`Gelen Mesaj Detayı -> Gönderen: ${name}, İletişim: ${email || phone}`);
    
    // 4. İşlem başarılıysa frontend'e (ön yüze) olumlu yanıt dönüyoruz
    return NextResponse.json({ success: true, message: "E-posta altyapısı güncellendi." });
  } catch (error) {
    // Bir hata olursa 500 (Sunucu Hatası) koduyla yanıt dönüyoruz
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}