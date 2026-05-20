import { Phone, Mail, MapPin, Instagram, Star } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import partyFavorLogo from "@/assets/party-favor-logo.png";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="md:col-span-2">
            <img 
              src="/lovable-uploads/4031df85-9654-492f-b28e-46b72d1d7fb8.png" 
              alt="Party Favor Photo" 
              className="h-12 mb-4"
            />
            <p className="mb-4 text-secondary-foreground/80 max-w-md">
              {t('footer.tagline')}
            </p>
            <p className="text-sm text-secondary-foreground/60">
              Established in Arlington, Virginia
            </p>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(202) 798-0610</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Arlington, VA</span>
              </div>
            </div>
          </div>
          
          {/* Service Areas */}
          <div>
            <h3 className="font-bold text-lg mb-4">Service Areas</h3>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li>Washington D.C.</li>
              <li>Arlington, VA</li>
              <li>Bethesda, MD</li>
              <li>Alexandria, VA</li>
              <li>Chevy Chase, MD</li>
              <li>Tysons Corner, VA</li>
            </ul>
          </div>
        </div>
        
        {/* Social Media and Copyright */}
        <div className="border-t border-secondary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <a 
              href="https://www.instagram.com/partyfavorphoto/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-secondary-foreground/70 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://m.yelp.com/biz/party-favor-photo-arlington-3&ved=2ahUKEwj4uJr-jMqPAxUYRTABHQBWB6gQFnoECGIQAQ&usg=AOvVaw04m1e8rHRMzeTObwSpWk9R" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-secondary-foreground/70 transition-colors"
            >
              <Star className="h-5 w-5" />
            </a>
          </div>
          <p className="text-sm text-secondary-foreground/60">
            {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;