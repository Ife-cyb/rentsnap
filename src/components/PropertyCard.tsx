import React, { useState, useMemo } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { Heart, MapPin, Star, Bed, Bath, Car } from 'lucide-react';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description?: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    address: string;
    city: string;
    state: string;
    amenities: string[];
    pet_friendly: boolean;
    furnished: boolean;
    parking_included: boolean;
    available_date: string;
    property_images: Array<{
      image_url: string;
      alt_text?: string;
      display_order: number;
      is_primary: boolean;
    }>;
    user_profiles?: {
      full_name: string;
      avatar_url?: string;
    };
    matchScore?: number;
  };
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSwipe, isActive }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [{ x, y, rot, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    config: { mass: 1, tension: 500, friction: 50 }
  }));

  // Memoize sorted images to prevent recalculation
  const displayImages = useMemo(() => {
    const images = property.property_images
      ?.sort((a, b) => a.display_order - b.display_order)
      ?.map(img => img.image_url) || [];
    
    return images.length > 0 ? images : [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'
    ];
  }, [property.property_images]);

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = xDir < 0 ? -1 : 1;
    
    if (!down && trigger) {
      onSwipe(dir === 1 ? 'right' : 'left');
    }
    
    api.start({
      x: down ? mx : 0,
      y: down ? 0 : 0,
      rot: down ? mx / 100 + (dir * velocity) / 2 : 0,
      scale: down ? 1.1 : 1,
      immediate: down
    });
  });

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < displayImages.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : displayImages.length - 1
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Memoize amenities display to prevent recalculation
  const amenitiesDisplay = useMemo(() => {
    const visibleAmenities = property.amenities.slice(0, 3);
    const remainingCount = property.amenities.length - 3;
    
    return {
      visible: visibleAmenities,
      remaining: remainingCount > 0 ? remainingCount : 0
    };
  }, [property.amenities]);

  return (
    <animated.div
      {...bind()}
      style={{
        x,
        y,
        rotate: rot,
        scale,
        touchAction: 'none'
      }}
      className={`absolute w-full h-full ${isActive ? 'z-20' : 'z-10'}`}
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full">
        {/* Image Carousel */}
        <div className="relative h-3/5 overflow-hidden">
          <img
            src={displayImages[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
            loading={isActive ? "eager" : "lazy"}
          />
          
          {/* Image Navigation */}
          {displayImages.length > 1 && (
            <div className="absolute inset-0 flex">
              <button
                onClick={prevImage}
                className="flex-1 bg-transparent"
                aria-label="Previous image"
              />
              <button
                onClick={nextImage}
                className="flex-1 bg-transparent"
                aria-label="Next image"
              />
            </div>
          )}

          {/* Image Indicators */}
          {displayImages.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {displayImages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Match Score Badge */}
          {property.matchScore && property.matchScore > 0 && (
            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {property.matchScore}% Match
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Property Details */}
        <div className="p-6 h-2/5 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{property.title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{property.city}, {property.state}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">${property.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500">/month</p>
            </div>
          </div>

          {/* Property Features */}
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center text-gray-600">
              <Bed className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Bath className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bathrooms} bath</span>
            </div>
            {property.parking_included && (
              <div className="flex items-center text-gray-600">
                <Car className="w-4 h-4 mr-1" />
                <span className="text-sm">Parking</span>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-3">
            {amenitiesDisplay.visible.map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
              >
                {amenity}
              </span>
            ))}
            {amenitiesDisplay.remaining > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{amenitiesDisplay.remaining} more
              </span>
            )}
          </div>

          {/* Landlord Info */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center">
              <img
                src={property.user_profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200'}
                alt={property.user_profiles?.full_name || 'Landlord'}
                className="w-8 h-8 rounded-full mr-2"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {property.user_profiles?.full_name || 'Property Owner'}
                </p>
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="text-xs text-gray-600">4.8</span>
                </div>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">
              Available {formatDate(property.available_date)}
            </span>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default PropertyCard;