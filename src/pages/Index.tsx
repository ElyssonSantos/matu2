import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { useEncarteNotifications } from '@/hooks/useEncarteNotifications';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BannerSlider } from '@/components/home/BannerSlider';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { SocialButtons } from '@/components/home/SocialButtons';
import { EncartesShowcase } from '@/components/home/EncartesShowcase';
import { RecommendedProducts } from '@/components/home/RecommendedProducts';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { ProductQuiz } from '@/components/home/ProductQuiz';
import { Footer } from '@/components/Footer';
import { RotatingMessages } from '@/components/home/RotatingMessages';
import { CouponModal } from '@/components/home/CouponModal';

const Index = () => {
  useEncarteNotifications();
  useAdminNotifications();

  return (
    <div className="min-h-screen">
      <RotatingMessages />
      <Header />
      <CouponModal />
      
      <div className="mb-8">
        <BannerSlider />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <CategoriesSection />
        
        <section className="text-center py-16">
          <h2 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Bem-vinda à Matu Cosméticos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sua Beleza Merece Destaque!
          </p>
        </section>

        <ProductCarousel title="Produtos em Destaque" filter="featured" />
        <ProductCarousel title="Mais Vendidos" filter="bestseller" />
        <ProductCarousel title="Lançamentos" filter="recent" />
        
        <div className="my-12">
          <ProductQuiz />
        </div>

        <RecommendedProducts />
        <EncartesShowcase />
      </main>
      
      <SocialButtons />
      <Footer />
    </div>
  );
};

export default Index;
