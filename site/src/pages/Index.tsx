import Hero from "@/components/Hero";
import Services from "@/components/Services";
import BookingCart from "@/components/BookingCart";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <div id="booking" className="py-16 bg-background">
        <BookingCart />
      </div>
      <Gallery />
      <div id="services" className="py-16 bg-muted/30">
        <Services />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
