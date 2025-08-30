import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Star, Filter, Search, Coffee, ShoppingBag, Utensils, Car, Heart, ExternalLink } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  hours: {
    [key: string]: string;
  };
  distance: number;
  price_level: number;
  amenities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  website?: string;
  description: string;
  photos: string[];
}

interface LocalBusinessDirectoryProps {
  userLocation?: { lat: number; lng: number };
}

const LocalBusinessDirectory: React.FC<LocalBusinessDirectoryProps> = ({ userLocation }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [showMap, setShowMap] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: MapPin },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'coffee', label: 'Coffee', icon: Coffee },
    { id: 'grocery', label: 'Grocery', icon: ShoppingBag },
    { id: 'gas', label: 'Gas Stations', icon: Car },
    { id: 'pharmacy', label: 'Pharmacy', icon: Heart },
  ];

  useEffect(() => {
    loadBusinesses();
  }, [userLocation]);

  useEffect(() => {
    filterAndSortBusinesses();
  }, [businesses, selectedCategory, searchQuery, sortBy]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      // Mock business data - in a real app, this would come from Google Places API, Yelp API, etc.
      const mockBusinesses: Business[] = [
        {
          id: '1',
          name: 'Blue Bottle Coffee',
          category: 'coffee',
          address: '1515 15th Ave, Seattle, WA 98122',
          phone: '(206) 555-0123',
          rating: 4.5,
          reviews: 324,
          hours: {
            'Monday': '6:00 AM - 8:00 PM',
            'Tuesday': '6:00 AM - 8:00 PM',
            'Wednesday': '6:00 AM - 8:00 PM',
            'Thursday': '6:00 AM - 8:00 PM',
            'Friday': '6:00 AM - 9:00 PM',
            'Saturday': '7:00 AM - 9:00 PM',
            'Sunday': '7:00 AM - 8:00 PM'
          },
          distance: 0.3,
          price_level: 2,
          amenities: ['WiFi', 'Outdoor Seating', 'Takeout'],
          coordinates: { lat: 47.6205, lng: -122.3214 },
          website: 'https://bluebottlecoffee.com',
          description: 'Artisanal coffee roaster with carefully crafted single-origin beans and espresso drinks.',
          photos: ['https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400']
        },
        {
          id: '2',
          name: 'Whole Foods Market',
          category: 'grocery',
          address: '1026 NE 64th St, Seattle, WA 98115',
          phone: '(206) 555-0456',
          rating: 4.2,
          reviews: 892,
          hours: {
            'Monday': '7:00 AM - 10:00 PM',
            'Tuesday': '7:00 AM - 10:00 PM',
            'Wednesday': '7:00 AM - 10:00 PM',
            'Thursday': '7:00 AM - 10:00 PM',
            'Friday': '7:00 AM - 10:00 PM',
            'Saturday': '7:00 AM - 10:00 PM',
            'Sunday': '8:00 AM - 9:00 PM'
          },
          distance: 0.8,
          price_level: 3,
          amenities: ['Organic', 'Deli', 'Pharmacy', 'Parking'],
          coordinates: { lat: 47.6748, lng: -122.3194 },
          description: 'Premium grocery store featuring organic and natural foods, prepared meals, and specialty items.',
          photos: ['https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400']
        },
        {
          id: '3',
          name: 'Canlis',
          category: 'restaurants',
          address: '2576 Aurora Ave N, Seattle, WA 98109',
          phone: '(206) 555-0789',
          rating: 4.8,
          reviews: 1247,
          hours: {
            'Monday': 'Closed',
            'Tuesday': '5:00 PM - 10:00 PM',
            'Wednesday': '5:00 PM - 10:00 PM',
            'Thursday': '5:00 PM - 10:00 PM',
            'Friday': '5:00 PM - 11:00 PM',
            'Saturday': '5:00 PM - 11:00 PM',
            'Sunday': '5:00 PM - 10:00 PM'
          },
          distance: 1.2,
          price_level: 4,
          amenities: ['Fine Dining', 'Valet Parking', 'Wine List', 'Reservations Required'],
          coordinates: { lat: 47.6426, lng: -122.3467 },
          website: 'https://canlis.com',
          description: 'Iconic fine dining restaurant offering Pacific Northwest cuisine with stunning city views.',
          photos: ['https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400']
        },
        {
          id: '4',
          name: 'Shell Gas Station',
          category: 'gas',
          address: '1200 E Pine St, Seattle, WA 98122',
          phone: '(206) 555-0321',
          rating: 3.8,
          reviews: 156,
          hours: {
            'Monday': '24 Hours',
            'Tuesday': '24 Hours',
            'Wednesday': '24 Hours',
            'Thursday': '24 Hours',
            'Friday': '24 Hours',
            'Saturday': '24 Hours',
            'Sunday': '24 Hours'
          },
          distance: 0.5,
          price_level: 2,
          amenities: ['24/7', 'Convenience Store', 'Car Wash', 'ATM'],
          coordinates: { lat: 47.6148, lng: -122.3194 },
          description: 'Full-service gas station with convenience store and car wash facilities.',
          photos: ['https://images.pexels.com/photos/33688/delicate-arch-night-stars-landscape.jpg?auto=compress&cs=tinysrgb&w=400']
        },
        {
          id: '5',
          name: 'Walgreens Pharmacy',
          category: 'pharmacy',
          address: '1625 Broadway, Seattle, WA 98122',
          phone: '(206) 555-0654',
          rating: 4.0,
          reviews: 203,
          hours: {
            'Monday': '8:00 AM - 10:00 PM',
            'Tuesday': '8:00 AM - 10:00 PM',
            'Wednesday': '8:00 AM - 10:00 PM',
            'Thursday': '8:00 AM - 10:00 PM',
            'Friday': '8:00 AM - 10:00 PM',
            'Saturday': '9:00 AM - 9:00 PM',
            'Sunday': '10:00 AM - 8:00 PM'
          },
          distance: 0.4,
          price_level: 2,
          amenities: ['Pharmacy', 'Photo Services', 'Health Products', 'Parking'],
          coordinates: { lat: 47.6062, lng: -122.3208 },
          description: 'Full-service pharmacy with health and wellness products, photo services, and prescriptions.',
          photos: ['https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=400']
        }
      ];

      setBusinesses(mockBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBusinesses = () => {
    let filtered = businesses;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(business => business.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.amenities.some(amenity => amenity.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort businesses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredBusinesses(filtered);
  };

  const getPriceLevel = (level: number) => {
    return '$'.repeat(level);
  };

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const isOpen = (hours: { [key: string]: string }) => {
    const today = getCurrentDay();
    const todayHours = hours[today];
    
    if (!todayHours || todayHours === 'Closed') return false;
    if (todayHours === '24 Hours') return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openTime, closeTime] = todayHours.split(' - ');
    const [openHour, openMin] = openTime.split(':');
    const [closeHour, closeMin] = closeTime.split(':');
    
    const openMinutes = parseInt(openHour) * 60 + parseInt(openMin);
    let closeMinutes = parseInt(closeHour) * 60 + parseInt(closeMin);
    
    // Handle PM times
    if (openTime.includes('PM') && !openTime.includes('12:')) {
      const adjustedOpenMinutes = openMinutes + 12 * 60;
    }
    if (closeTime.includes('PM') && !closeTime.includes('12:')) {
      closeMinutes += 12 * 60;
    }

    return currentTime >= openMinutes && currentTime <= closeMinutes;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading local businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center mb-4">
            <MapPin className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Local Business Directory</h1>
          </div>
          <p className="text-blue-100">
            Discover essential services and amenities near your location
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="distance">Sort by Distance</option>
              <option value="rating">Sort by Rating</option>
              <option value="reviews">Sort by Reviews</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex">
                  {/* Business Image */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={business.photos[0]}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Business Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                        <div className="flex items-center text-gray-600 mb-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{business.address}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span>{business.rating} ({business.reviews} reviews)</span>
                          </div>
                          <span>{getPriceLevel(business.price_level)}</span>
                          <span>{business.distance} mi</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isOpen(business.hours) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isOpen(business.hours) ? 'Open' : 'Closed'}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{business.description}</p>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {business.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {business.amenities.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{business.amenities.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Hours and Contact */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{business.hours[getCurrentDay()]}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${business.phone}`}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </a>
                        {business.website && (
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Website
                          </a>
                        )}
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Directions
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalBusinessDirectory;