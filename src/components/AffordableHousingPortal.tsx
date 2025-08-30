import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, DollarSign, Users, MapPin, Phone, Mail, ExternalLink, 
  Filter, Search, Heart, Info, CheckCircle, AlertCircle, Loader
} from 'lucide-react';

interface HousingProgram {
  id: string;
  name: string;
  description: string;
  eligibility: string[];
  income_limits: {
    household_size_1: number;
    household_size_2: number;
    household_size_3: number;
    household_size_4: number;
  };
  contact_info: {
    phone: string;
    email: string;
    website: string;
  };
  application_deadline?: string;
  available_units: number;
  location: string;
}

const AffordableHousingPortal: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<HousingProgram[]>([]);
  const [affordableProperties, setAffordableProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<HousingProgram | null>(null);
  const [filters, setFilters] = useState({
    maxIncome: '',
    householdSize: 1,
    location: ''
  });

  useEffect(() => {
    loadAffordableHousing();
  }, []);

  const loadAffordableHousing = async () => {
    setLoading(true);
    try {
      // Load affordable housing programs (mock data for demo)
      const mockPrograms: HousingProgram[] = [
        {
          id: '1',
          name: 'Section 8 Housing Choice Voucher',
          description: 'Federal rental assistance program helping low-income families afford decent, safe housing.',
          eligibility: ['Income below 50% of area median', 'US citizen or eligible immigrant', 'Pass background check'],
          income_limits: {
            household_size_1: 35000,
            household_size_2: 40000,
            household_size_3: 45000,
            household_size_4: 50000
          },
          contact_info: {
            phone: '(555) 123-4567',
            email: 'section8@housing.gov',
            website: 'https://www.hud.gov/topics/housing_choice_voucher'
          },
          application_deadline: '2024-03-15',
          available_units: 150,
          location: 'Seattle, WA'
        },
        {
          id: '2',
          name: 'Low-Income Housing Tax Credit (LIHTC)',
          description: 'Affordable rental housing for individuals and families earning 60% or less of area median income.',
          eligibility: ['Income below 60% of area median', 'Meet property-specific requirements'],
          income_limits: {
            household_size_1: 42000,
            household_size_2: 48000,
            household_size_3: 54000,
            household_size_4: 60000
          },
          contact_info: {
            phone: '(555) 234-5678',
            email: 'lihtc@housing.wa.gov',
            website: 'https://www.commerce.wa.gov/serving-communities/housing/'
          },
          available_units: 75,
          location: 'King County, WA'
        },
        {
          id: '3',
          name: 'Public Housing Program',
          description: 'Federally funded housing assistance for very low-income families, elderly, and disabled individuals.',
          eligibility: ['Income below 30% of area median', 'Meet federal eligibility requirements'],
          income_limits: {
            household_size_1: 21000,
            household_size_2: 24000,
            household_size_3: 27000,
            household_size_4: 30000
          },
          contact_info: {
            phone: '(555) 345-6789',
            email: 'publichousing@sha.org',
            website: 'https://www.seattlehousing.org/'
          },
          available_units: 200,
          location: 'Seattle, WA'
        }
      ];

      setPrograms(mockPrograms);

      // Load affordable properties
      const { data: properties } = await db.getProperties({
        maxPrice: 2000, // Affordable threshold
        limit: 20
      });
      
      setAffordableProperties(properties || []);
    } catch (error) {
      console.error('Error loading affordable housing:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = (program: HousingProgram, income: number, householdSize: number) => {
    const incomeLimit = program.income_limits[`household_size_${Math.min(householdSize, 4)}` as keyof typeof program.income_limits];
    return income <= incomeLimit;
  };

  const filteredPrograms = programs.filter(program => {
    if (filters.maxIncome && filters.householdSize) {
      return checkEligibility(program, parseInt(filters.maxIncome), filters.householdSize);
    }
    if (filters.location) {
      return program.location.toLowerCase().includes(filters.location.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading affordable housing options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center mb-4">
            <Home className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Affordable Housing Portal</h1>
          </div>
          <p className="text-blue-100 mb-4">
            Find income-restricted housing and assistance programs in your area
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{programs.length}</div>
              <div className="text-sm text-blue-100">Programs Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{programs.reduce((sum, p) => sum + p.available_units, 0)}</div>
              <div className="text-sm text-blue-100">Units Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{affordableProperties.length}</div>
              <div className="text-sm text-blue-100">Affordable Listings</div>
            </div>
          </div>
        </div>

        {/* Eligibility Calculator */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check Your Eligibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Household Income</label>
              <input
                type="number"
                value={filters.maxIncome}
                onChange={(e) => setFilters(prev => ({ ...prev, maxIncome: e.target.value }))}
                placeholder="e.g., 45000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Household Size</label>
              <select
                value={filters.householdSize}
                onChange={(e) => setFilters(prev => ({ ...prev, householdSize: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>1 person</option>
                <option value={2}>2 people</option>
                <option value={3}>3 people</option>
                <option value={4}>4+ people</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City or County"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Housing Programs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Housing Assistance Programs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredPrograms.map((program) => {
              const isEligible = filters.maxIncome && filters.householdSize ? 
                checkEligibility(program, parseInt(filters.maxIncome), filters.householdSize) : null;

              return (
                <div key={program.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">{program.name}</h3>
                        {isEligible !== null && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isEligible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{program.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Eligibility Requirements</h4>
                          <ul className="space-y-1">
                            {program.eligibility.map((req, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Income Limits (Annual)</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>1 person: ${program.income_limits.household_size_1.toLocaleString()}</div>
                            <div>2 people: ${program.income_limits.household_size_2.toLocaleString()}</div>
                            <div>3 people: ${program.income_limits.household_size_3.toLocaleString()}</div>
                            <div>4+ people: ${program.income_limits.household_size_4.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {program.location}
                          </div>
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-1" />
                            {program.available_units} units available
                          </div>
                          {program.application_deadline && (
                            <div className="flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Deadline: {new Date(program.application_deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedProgram(program)}
                          className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Affordable Properties */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Affordable Rental Listings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {affordableProperties.slice(0, 6).map((property) => {
              const primaryImage = property.property_images?.find((img: any) => img.is_primary)?.image_url ||
                                 property.property_images?.[0]?.image_url ||
                                 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';

              return (
                <div key={property.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={primaryImage}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Affordable
                    </div>
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        ${property.price.toLocaleString()}/mo
                      </span>
                      <div className="text-sm text-gray-600">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h2>
              <button
                onClick={() => setSelectedProgram(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Program Description</h3>
                <p className="text-gray-600">{selectedProgram.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <a href={`tel:${selectedProgram.contact_info.phone}`} className="text-purple-600 hover:text-purple-700">
                      {selectedProgram.contact_info.phone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <a href={`mailto:${selectedProgram.contact_info.email}`} className="text-purple-600 hover:text-purple-700">
                      {selectedProgram.contact_info.email}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <ExternalLink className="w-5 h-5 text-gray-400 mr-3" />
                    <a 
                      href={selectedProgram.contact_info.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Next Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-purple-800">
                  <li>Review eligibility requirements carefully</li>
                  <li>Gather required documentation (income statements, ID, etc.)</li>
                  <li>Contact the program directly using the information above</li>
                  <li>Submit your application before the deadline</li>
                  <li>Follow up on your application status</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffordableHousingPortal;