import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { usePreferences } from '../hooks/usePreferences';
import { useProperties } from '../hooks/useProperties';
import { X, Sliders, MapPin, Bed, DollarSign, Heart, Loader } from 'lucide-react';

const FilterPanel: React.FC = () => {
  const { showFilters, toggleFilters } = useStore();
  const { preferences, updatePreferences } = usePreferences();
  const { fetchProperties } = useProperties();
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    budget_min: 1000,
    budget_max: 5000,
    preferred_bedrooms: [1, 2],
    search_radius: 10,
    pet_friendly: false,
    furnished_preferred: false,
    parking_required: false
  });

  useEffect(() => {
    if (preferences) {
      setFilters({
        budget_min: preferences.budget_min,
        budget_max: preferences.budget_max,
        preferred_bedrooms: preferences.preferred_bedrooms,
        search_radius: preferences.search_radius,
        pet_friendly: preferences.pet_friendly,
        furnished_preferred: preferences.furnished_preferred,
        parking_required: preferences.parking_required
      });
    }
  }, [preferences]);

  if (!showFilters) return null;

  const handleBudgetChange = (type: 'budget_min' | 'budget_max', value: number) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleBedroomToggle = (bedrooms: number) => {
    setFilters(prev => ({
      ...prev,
      preferred_bedrooms: prev.preferred_bedrooms.includes(bedrooms)
        ? prev.preferred_bedrooms.filter(b => b !== bedrooms)
        : [...prev.preferred_bedrooms, bedrooms]
    }));
  };

  const handleToggle = (key: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    
    // Update user preferences
    await updatePreferences(filters);
    
    // Apply filters to property search
    const propertyFilters = {
      minPrice: filters.budget_min,
      maxPrice: filters.budget_max,
      bedrooms: filters.preferred_bedrooms,
      petFriendly: filters.pet_friendly,
      furnished: filters.furnished_preferred,
      parking: filters.parking_required
    };
    
    await fetchProperties(propertyFilters);
    
    setLoading(false);
    toggleFilters();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Sliders className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={toggleFilters}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Budget Range */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Budget Range</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Minimum</label>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={filters.budget_min}
                onChange={(e) => handleBudgetChange('budget_min', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium text-purple-600">
                ${filters.budget_min.toLocaleString()}
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Maximum</label>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={filters.budget_max}
                onChange={(e) => handleBudgetChange('budget_max', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium text-purple-600">
                ${filters.budget_max.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Bed className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Bedrooms</h3>
          </div>
          <div className="flex space-x-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => handleBedroomToggle(num)}
                className={`w-12 h-12 rounded-full font-medium transition-colors ${
                  filters.preferred_bedrooms.includes(num)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Search Radius */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Search Radius</h3>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.search_radius}
            onChange={(e) => setFilters(prev => ({ ...prev, search_radius: parseInt(e.target.value) }))}
            className="w-full mb-2"
          />
          <span className="text-sm font-medium text-purple-600">
            {filters.search_radius} miles
          </span>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
          <div className="space-y-3">
            {[
              { key: 'pet_friendly', label: 'Pet-Friendly', icon: Heart },
              { key: 'furnished_preferred', label: 'Furnished', icon: null },
              { key: 'parking_required', label: 'Parking Required', icon: null }
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters[key as keyof typeof filters] as boolean}
                  onChange={() => handleToggle(key as keyof typeof filters)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                  filters[key as keyof typeof filters]
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-300'
                }`}>
                  {filters[key as keyof typeof filters] && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="w-full bg-purple-500 text-white py-3 rounded-full font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Applying Filters...
            </>
          ) : (
            'Apply Filters'
          )}
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;