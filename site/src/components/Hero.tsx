import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, ShoppingCart } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/contexts/TranslationContext";
import { useCart } from "@/contexts/CartContext";
// Removed RelocationAnnouncement import
import partyFavorLogo from "@/assets/party-favor-logo-new.png";
import celebrationBoothImage from "@/assets/celebration-booth.jpg";

import studioStationImage from "@/assets/studio-station.jpg";
const weddingBoothImage = "/lovable-uploads/52305c16-be59-45d0-92ad-614aa25fefae.png";
import corporateBoothImage from "@/assets/corporate-booth.jpg";

const Hero = () => {
  const { language, toggleLanguage, t } = useTranslation();
  const { getTotalItems } = useCart();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const heroSlides = [
    {
      title: t('hero.studioStation.title'),
      subtitle: t('hero.studioStation.subtitle'),
      price: t('hero.studioStation.price'),
      duration: t('hero.studioStation.duration'),
      image: studioStationImage,
      description: t('hero.studioStation.description'),
      cta: t('hero.studioStation.cta'),
      isHero: true
    },
    {
      title: t('hero.professional.title'),
      subtitle: t('hero.professional.subtitle'),
      price: t('hero.professional.price'),
      duration: t('hero.professional.duration'),
      image: celebrationBoothImage,
      description: t('hero.professional.description'),
      cta: t('hero.professional.cta')
    },
    {
      title: t('hero.wedding.title'),
      subtitle: t('hero.wedding.subtitle'),
      price: t('hero.wedding.price'),
      duration: t('hero.wedding.duration'), 
      image: weddingBoothImage,
      description: t('hero.wedding.description'),
      cta: t('hero.wedding.cta')
    },
    {
      title: t('hero.corporate.title'),
      subtitle: t('hero.corporate.subtitle'),
      price: t('hero.corporate.price'),
      duration: t('hero.corporate.duration'),
      image: corporateBoothImage, 
      description: t('hero.corporate.description'),
      cta: t('hero.corporate.cta')
    }
  ];

  return (
    <section className="bg-background">
      {/* Mobile-First Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-border/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          {/* Mobile Layout - Compact & Modern */}
          <div className="flex md:hidden items-center justify-between py-1">
            {/* Left: Logo - Doubled size from h-8 to h-16 */}
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/4031df85-9654-492f-b28e-46b72d1d7fb8.png"
                alt="Party Favor Photo" 
                className="h-16 w-auto object-contain mix-blend-multiply"
              />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <a href="tel:+12027980610" className="bg-primary/10 p-2 rounded-full text-primary">
                <Phone className="h-4 w-4" />
              </a>
              <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                <span className="text-[10px] font-bold text-muted-foreground">ES</span>
                <Switch
                  checked={language === 'es'}
                  onCheckedChange={toggleLanguage}
                  className="scale-50"
                />
              </div>
              <button 
                className="relative p-2"
                onClick={() => scrollToSection('cart')}
              >
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Layout - Three Column Grid */}
          <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-4">
            {/* Language Toggle - Left */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-sans font-medium text-muted-foreground">
                {language === 'en' ? 'EN' : 'ES'}
              </span>
              <Switch
                checked={language === 'es'}
                onCheckedChange={toggleLanguage}
                className="scale-75"
              />
            </div>
            
            {/* Logo - Center */}
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/4031df85-9654-492f-b28e-46b72d1d7fb8.png"
                alt="Party Favor Photo" 
                className="h-16 lg:h-20 object-contain"
              />
            </div>
            
            {/* Contact Actions - Right */}
            <div className="flex items-center gap-4 justify-end">
              <a 
                href="tel:+12027980610" 
                className="flex items-center gap-2 hover:text-primary transition-colors font-sans text-muted-foreground font-semibold"
              >
                <Phone className="h-4 w-4" />
                <span className="text-base">(202) 798-0610</span>
              </a>
              <button 
                className="relative flex items-center justify-center hover:text-primary transition-colors"
                onClick={() => scrollToSection('cart')}
              >
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Relocation Announcement Removed */}

      {/* Full-Screen Mobile Hero */}
      <div className="relative h-[calc(100vh-60px)] md:min-h-screen">
        <Carousel className="h-full">
          <CarouselContent className="h-full">
            {heroSlides.map((slide, index) => (
              <CarouselItem key={index} className="relative h-[calc(100vh-60px)] md:min-h-screen">
                <div className="relative h-full flex flex-col">
                  {/* Background Image - Takes full screen */}
                  <div className="relative flex-1 h-full">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    
                    {/* Mobile-First Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 md:bg-gradient-to-r md:from-black/50 md:via-black/30 md:to-black/10" />
                    
                    {/* Content Overlay - Positioned higher on page */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center md:justify-start md:items-start px-5 pt-12 md:pt-32">
                      <div className="max-w-lg sm:max-w-xl md:max-w-2xl text-white text-center md:text-left md:ml-8 lg:ml-12">
                        {slide.isHero ? (
                          <>
                            {/* Hero Content - Corporate styling with drop shadows */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight font-sans drop-shadow-2xl" style={{ textShadow: '2px 4px 12px rgba(0,0,0,0.9)' }}>
                              {slide.title}
                            </h1>
                            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 opacity-95 font-sans font-medium leading-relaxed drop-shadow-lg" style={{ textShadow: '1px 2px 6px rgba(0,0,0,0.8)' }}>
                              {slide.subtitle}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto md:mx-0">
                              <Button 
                                size="lg" 
                                className="px-8 py-4 text-lg font-sans font-semibold bg-primary hover:bg-primary-elegant shadow-button hover:shadow-xl transition-all transform hover:-translate-y-1"
                                onClick={() => scrollToSection('booking')}
                              >
                                {slide.cta}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="lg" 
                                className="px-8 py-4 text-lg border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-primary transition-all font-sans font-semibold backdrop-blur-md"
                                onClick={() => scrollToSection('gallery')}
                              >
                                {t('hero.viewWork')}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Service Slides Content - Corporate styling with drop shadows */}
                            <div className="mb-8">
                              <p className="text-base uppercase tracking-wide font-semibold opacity-90 mb-4 font-sans text-primary-glow drop-shadow-md" style={{ textShadow: '1px 2px 4px rgba(0,0,0,0.5)' }}>
                                {slide.subtitle}
                              </p>
                              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-sans leading-tight drop-shadow-2xl" style={{ textShadow: '2px 4px 12px rgba(0,0,0,0.9)' }}>
                                {slide.title}
                              </h2>
                              <p className="text-base sm:text-lg md:text-xl mb-6 opacity-95 font-sans font-medium leading-relaxed drop-shadow-lg" style={{ textShadow: '1px 2px 6px rgba(0,0,0,0.8)' }}>
                                {slide.description}
                              </p>
                              
                              {/* Pricing Info - Corporate styling */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 justify-center md:justify-start">
                                <span className="bg-primary/20 border border-primary/40 px-6 py-3 rounded-full backdrop-blur-sm font-sans font-semibold text-primary-glow text-lg drop-shadow-md">
                                  {slide.price}
                                </span>
                                <span className="opacity-90 font-sans font-medium text-base drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                  {t('hero.duration')}: {slide.duration}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              size="lg" 
                              className="px-8 py-4 font-sans font-semibold text-lg bg-primary hover:bg-primary-elegant shadow-button hover:shadow-xl transition-all transform hover:-translate-y-1"
                              onClick={() => scrollToSection('booking')}
                            >
                              {slide.cta}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Mobile-friendly navigation - Positioned for full screen */}
          <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white border-white/50 bg-black/40 hover:bg-white hover:text-primary transition-all h-12 w-12 backdrop-blur-sm" />
          <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white border-white/50 bg-black/40 hover:bg-white hover:text-primary transition-all h-12 w-12 backdrop-blur-sm" />
        </Carousel>
      </div>
    </section>
  );
};

export default Hero;