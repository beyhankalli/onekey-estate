import Hero from "@/components/Hero";
import FeaturedProperties from "@/components/FeaturedProperties"; // Yeni bileşenimizi içe aktarıyoruz

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. Karşılama Alanı */}
      <Hero />
      
      {/* 2. Öne Çıkan İlanlar Alanı */}
      <FeaturedProperties />
      
    </div>
  );
}