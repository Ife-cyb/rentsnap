import React, { useState, useEffect } from 'react';
import { MapPin, Shield, GraduationCap, Users, Footprints, Car, Coffee, ShoppingBag, Star, TrendingUp, Loader } from 'lucide-react';

interface NeighborhoodData {
  id: string;
  name: string;
  city: string;
  state: string;
  scores: {
    diversity: number;
    safety: number;
    schools: number;
    walkability: number;
    transit: number;
    nightlife: number;
    cost_of_living: number;
  };
  demographics: {
    population: number;
    median_age: number;
    median_income: number;
    diversity_index: number;
  };
  amenities: {
    restaurants: number;
    coffee_shops: number;
    grocery_stores: number;
    gyms: number;
    parks: number;
    schools: number;
  };
  crime_stats: {
    crime_rate: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  commute_data: {
    avg_commute_time: number;
    public_transit_score: number;
    bike_score: number;
  };
}

interface NeighborhoodInsightsProps {
  propertyLocation?: { lat: number; lng: number; city: string; state: string };
}

const NeighborhoodInsights: React.FC<NeighborhoodInsightsProps> = ({ propertyLocation }) => {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNeighborhoodData();
  }, []);

  const loadNeighborhoodData = async () => {
    setLoading(true);
    try {
      // Mock neighborhood data - in a real app, this would come from APIs like Walk Score, Census, etc.
      const mockNeighborhoods: NeighborhoodData[] = [
        {
          id: '1',
          name: 'Capitol Hill',
          city: 'Seattle',
          state: 'WA',
          scores: {
            diversity: 92,
            safety: 78,
            schools: 85,
            walkability: 95,
            transit: 88,
            nightlife: 96,
            cost_of_living: 65
          },
          demographics: {
            population: 32000,
            median_age: 29,
            median_income: 75000,
            diversity_index: 0.85
          },
          amenities: {
            restaurants: 150,
            coffee_shops: 45,
            grocery_stores: 12,
            gyms: 8,
            parks: 6,
            schools: 4
          },
          crime_stats: {
            crime_rate: 3.2,
            trend: 'decreasing'
          },
          commute_data: {
            avg_commute_time: 22,
            public_transit_score: 85,
            bike_score: 90
          }
        },
        {
          id: '2',
          name: 'Fremont',
          city: 'Seattle',
          state: 'WA',
          scores: {
            diversity: 78,
            safety: 88,
            schools: 92,
            walkability: 82,
            transit: 75,
            nightlife: 72,
            cost_of_living: 72
          },
          demographics: {
            population: 28000,
            median_age: 35,
            median_income: 85000,
            diversity_index: 0.72
          },
          amenities: {
            restaurants: 85,
            coffee_shops: 25,
            grocery_stores: 8,
            gyms: 5,
            parks: 12,
            schools: 8
          },
          crime_stats: {
            crime_rate: 2.1,
            trend: 'stable'
          },
          commute_data: {
            avg_commute_time: 28,
            public_transit_score: 72,
            bike_score: 85
          }
        },
        {
          id: '3',
          name: 'Belltown',
          city: 'Seattle',
          state: 'WA',
          scores: {
            diversity: 85,
            safety: 72,
            schools: 68,
            walkability: 98,
            transit: 92,
            nightlife: 94,
            cost_of_living: 58
          },
          demographics: {
            population: 18000,
            median_age: 32,
            median_income: 95000,
            diversity_index: 0.78
          },
          amenities: {
            restaurants: 200,
            coffee_shops: 35,
            grocery_stores: 6,
            gyms: 12,
            parks: 3,
            schools: 2
          },
          crime_stats: {
            crime_rate: 4.1,
            trend: 'decreasing'
          },
          commute_data: {
            avg_commute_time: 18,
            public_transit_score: 95,
            bike_score: 88
          }
        }
      ];

      setNeighborhoods(mockNeighborhoods);
      if (propertyLocation) {
        // Auto-select neighborhood based on property location
        setSelectedNeighborhood(mockNeighborhoods[0]);
      }
    } catch (error) {
      console.error('Error loading neighborhood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const filteredNeighborhoods = neighborhoods.filter(neighborhood =>
    neighborhood.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    neighborhood.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading neighborhood insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center mb-4">
            <MapPin className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Neighborhood Insights</h1>
          </div>
          <p className="text-green-100 mb-4">
            Discover detailed insights about neighborhoods including safety, schools, walkability, and diversity scores
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neighborhoods..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Neighborhood Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredNeighborhoods.map((neighborhood) => (
            <div
              key={neighborhood.id}
              onClick={() => setSelectedNeighborhood(neighborhood)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{neighborhood.name}</h3>
                  <p className="text-gray-600">{neighborhood.city}, {neighborhood.state}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((neighborhood.scores.diversity + neighborhood.scores.safety + neighborhood.scores.schools + neighborhood.scores.walkability) / 4)}
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-blue-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{neighborhood.scores.diversity}</div>
                    <div className="text-xs text-gray-500">Diversity</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{neighborhood.scores.safety}</div>
                    <div className="text-xs text-gray-500">Safety</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 text-purple-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{neighborhood.scores.schools}</div>
                    <div className="text-xs text-gray-500">Schools</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Footprints className="w-4 h-4 text-orange-500 mr-2" />
                  <div>
                    <div className="text-sm font-medium">{neighborhood.scores.walkability}</div>
                    <div className="text-xs text-gray-500">Walkability</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed View */}
        {selectedNeighborhood && (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedNeighborhood.name}</h2>
                  <p className="text-gray-600">{selectedNeighborhood.city}, {selectedNeighborhood.state}</p>
                </div>
                <button
                  onClick={() => setSelectedNeighborhood(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Score Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(selectedNeighborhood.scores).map(([key, score]) => {
                  const icons = {
                    diversity: Users,
                    safety: Shield,
                    schools: GraduationCap,
                    walkability: Footprints,
                    transit: Car,
                    nightlife: Star,
                    cost_of_living: TrendingUp
                  };
                  const Icon = icons[key as keyof typeof icons];
                  
                  return (
                    <div key={key} className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${getScoreColor(score)}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{score}</div>
                      <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                      <div className={`text-xs font-medium ${getScoreColor(score).split(' ')[0]}`}>
                        {getScoreLabel(score)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Demographics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Population</span>
                      <span className="font-medium">{selectedNeighborhood.demographics.population.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Age</span>
                      <span className="font-medium">{selectedNeighborhood.demographics.median_age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median Income</span>
                      <span className="font-medium">${selectedNeighborhood.demographics.median_income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diversity Index</span>
                      <span className="font-medium">{(selectedNeighborhood.demographics.diversity_index * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Local Amenities</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Coffee className="w-4 h-4 text-brown-500 mr-2" />
                        <span className="text-gray-600">Restaurants</span>
                      </div>
                      <span className="font-medium">{selectedNeighborhood.amenities.restaurants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Coffee className="w-4 h-4 text-orange-500 mr-2" />
                        <span className="text-gray-600">Coffee Shops</span>
                      </div>
                      <span className="font-medium">{selectedNeighborhood.amenities.coffee_shops}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ShoppingBag className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">Grocery Stores</span>
                      </div>
                      <span className="font-medium">{selectedNeighborhood.amenities.grocery_stores}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-gray-600">Schools</span>
                      </div>
                      <span className="font-medium">{selectedNeighborhood.amenities.schools}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Transportation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. Commute</span>
                      <span className="font-medium">{selectedNeighborhood.commute_data.avg_commute_time} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transit Score</span>
                      <span className="font-medium">{selectedNeighborhood.commute_data.public_transit_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bike Score</span>
                      <span className="font-medium">{selectedNeighborhood.commute_data.bike_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crime Rate</span>
                      <span className={`font-medium ${
                        selectedNeighborhood.crime_stats.crime_rate < 3 ? 'text-green-600' : 
                        selectedNeighborhood.crime_stats.crime_rate < 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {selectedNeighborhood.crime_stats.crime_rate}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crime Trend */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Safety Trend</h3>
                <div className="flex items-center">
                  <TrendingUp className={`w-5 h-5 mr-2 ${
                    selectedNeighborhood.crime_stats.trend === 'decreasing' ? 'text-green-500' :
                    selectedNeighborhood.crime_stats.trend === 'stable' ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                  <span className="text-gray-700">
                    Crime rates are {selectedNeighborhood.crime_stats.trend} in this neighborhood
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeighborhoodInsights;