import React, { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/supabase';
import { Property } from '../hooks/useProperties';
import { Search, Filter, MapPin, Bed, Bath, Star, Heart, Loader, X } from 'lucide-react';

interface SearchInterfaceProps {
  onPropertySelect?: (property: Property) => void;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ onPropertySelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: [] as number[],
    propertyType: '',
    petFriendly: false,
    furnished: false,
    parking: false
  });

  const searchProperties = useCallback(async (searchQuery: string, searchFilters?: any) => {
    if (!searchQuery.trim() && !searchFilters) return;

    setLoading(true);
    try {
      const { data, error } = await db.searchProperties(searchQuery, {
        minPrice: searchFilters?.minPrice ? parseInt(searchFilters.minPrice) : undefined,
        maxPrice: searchFilters?.maxPrice ? parseInt(searchFilters.maxPrice) : undefined,
        bedrooms: searchFilters?.bedrooms?.length > 0 ? searchFilters.bedrooms : undefined,
        propertyType: searchFilters?.propertyType || undefined,
        petFriendly: searchFilters?.petFriendly || undefined,
        furnished: searchFilters?.furnished || undefined,
        parking: searchFilters?.parking || undefined
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    searchProperties(query, filters);
  }, [query, filters, searchProperties]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleBedroom = (bedrooms: number) => {
    setFilters(prev => ({
      ...prev,
      bedrooms: prev.bedrooms.includes(bedrooms)
        ? prev.bedrooms.filter(b => b !== bedrooms)
        : [...prev.bedrooms, bedrooms]
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: [],
      propertyType: '',
      petFriendly: false,
      furnished: false,
      parking: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  useEffect(() => {
    if (query.trim()) {
      const debounceTimer = setTimeout(() => {
        searchProperties(query, filters);
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [query, searchProperties]);

  return (
    <div className="flex-1 bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by location, amenities, or property type..."
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                hasActiveFilters ? 'text-purple-600 bg-purple-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleBedroom(num)}
                      className={`w-10 h-10 rounded-full font-medium transition-colors ${
                        filters.bedrooms.includes(num)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="studio">Studio</option>
                  <option value="loft">Loft</option>
                </select>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                  {[
                    { key: 'petFriendly', label: 'Pet-Friendly' },
                    { key: 'furnished', label: 'Furnished' },
                    { key: 'parking', label: 'Parking Included' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters[key as keyof typeof filters] as boolean}
                        onChange={(e) => handleFilterChange(key, e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {results.length} properties found
              </h3>
              {hasActiveFilters && (
                <span className="text-sm text-purple-600">Filters applied</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((property) => {
                const primaryImage = property.property_images?.find(img => img.is_primary)?.image_url ||
                                   property.property_images?.[0]?.image_url ||
                                   'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';

                return (
                  <div
                    key={property.id}
                    onClick={() => onPropertySelect?.(property)}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="relative h-48">
                      <img
                        src={primaryImage}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{property.title}</h4>
                        <span className="text-lg font-bold text-purple-600">
                          ${property.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.city}, {property.state}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-gray-600">
                            <Bed className="w-4 h-4 mr-1" />
                            <span className="text-sm">{property.bedrooms}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Bath className="w-4 h-4 mr-1" />
                            <span className="text-sm">{property.bathrooms}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Star className="w-4 h-4 mr-1" />
                          <span className="text-sm">4.8</span>
                        </div>
                      </div>

                      {property.amenities && property.amenities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {property.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{property.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;