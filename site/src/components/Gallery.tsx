import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/contexts/TranslationContext";

interface Review {
  author: string;
  date: string;
  text: string;
}

const Gallery = () => {
  const { t } = useTranslation();
  const galleryItems = [
    {
      image: "/lovable-uploads/48af98af-f972-4155-bd47-0cf3c74b3b87.png",
      review: {
        author: "Rebecca F",
        date: "January 2023",
        text: "Our photobooth was a bit of an afterthought, but it turned out to be a highlight of our wedding! Communications with Party Favor were always easy--they were responsive and helpful at every turn! They worked with us to customize the photobooth to meet our needs."
      }
    },
    {
      image: "/lovable-uploads/3cc2987c-2e74-4ec7-8078-e34c7a1ae6f3.png",
      review: {
        author: "Andria S",
        date: "November 2021",
        text: "Our photo booth photos came out looking like grade A quality- many of our guests appreciated the ease of taking photos and the quality of the photos that were printed. The staff members were professional and so fun to interact with!"
      }
    },
    {
      image: "/lovable-uploads/ceede732-6be3-4495-8012-6c449e7756b0.png",
      review: {
        author: "Hui Jin K",
        date: "November 2021", 
        text: "Photobooth was such a crowd pleaser! The attendant kept it organized and moved the people along. The props were so much fun. Thank you for making our wedding day so special!"
      }
    },
    {
      image: "/lovable-uploads/cf071d88-4a31-46b6-af80-9d4a813ed220.png",
      review: {
        author: "Connie C",
        date: "October 2021",
        text: "We had such a great experience with Party Favor Photo. The team was so easy to work with. They sent a full gallery of our guests' pictures within 24 hours! Their price and quality cannot be beat!"
      }
    },
    {
      image: "/lovable-uploads/cd34369a-8eea-43f8-9d03-74455d747a42.png",
      review: {
        author: "Alayna B",
        date: "September 2021",
        text: "We are so happy that we chose Party Favor Photo for our photo booth! They were very responsive with all of our questions. Calvin was punctual, friendly, and very interactive with our guests."
      }
    },
    {
      image: "/lovable-uploads/48af98af-f972-4155-bd47-0cf3c74b3b87.png",
      review: {
        author: "Catherine J",
        date: "January 2020",
        text: "Great service and value! The team was professional and the photo booth was a hit at our corporate event. Highly recommend for any occasion."
      }
    },
    {
      image: "/lovable-uploads/3cc2987c-2e74-4ec7-8078-e34c7a1ae6f3.png",
      review: {
        author: "Krystal B",
        date: "December 2018", 
        text: "So glad we made the call to go with Party Favor Photo & decided at the last minute to get a photo booth. Guests had so much fun, and everything came together so well!"
      }
    },
    {
      image: "/lovable-uploads/ceede732-6be3-4495-8012-6c449e7756b0.png",
      review: {
        author: "Ellen K",
        date: "September 2018",
        text: "We just used Party Favor Photo for my daughter's wedding and the photo booth was a major highlight. They are professional, fun and very easy to work with! The quality of the photos is extremely high."
      }
    }
  ];

  return (
    <section id="gallery" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mb-6">
            <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 shadow-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-bold text-base sm:text-lg">5.0</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{t('gallery.theKnot')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 shadow-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-bold text-base sm:text-lg">5.0</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{t('gallery.weddingWire')}</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('gallery.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-[3/2] relative overflow-hidden">
                <img
                  src={item.image}
                  alt={`Photo booth moment ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{t('gallery.theKnot')}</span>
                </div>
                <blockquote className="text-foreground mb-3 italic text-sm">
                  "{item.review.text}"
                </blockquote>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                  <span className="font-medium">{item.review.author}</span>
                  <span>{item.review.date}</span>
                </div>
                <a 
                  href="https://www.theknot.com/marketplace/party-favor-photo-arlington-va-989593"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  {t('gallery.readFullReview')}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-4 px-4">
            <a 
              href="https://www.theknot.com/marketplace/party-favor-photo-arlington-va-989593"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-center">{t('gallery.viewAllReviews')}</span>
              <span>→</span>
            </a>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{t('gallery.verifiedReviews')}</span>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            {t('gallery.readyToCreate')}
          </p>
          <a 
            href="#booking"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
          >
            {t('gallery.bookToday')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Gallery;