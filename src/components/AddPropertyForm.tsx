import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProperties } from '../hooks/useProperties';
import { X, Plus, Minus, Loader } from 'lucide-react';

interface AddPropertyFormProps {
  onClose: () => void;
}

const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { createProperty } = useProperties();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    amenities: [''],
    pet_friendly: false,
    furnished: false,
    parking_included: false,
    available_date: new Date().toISOString().split('T')[0],
    property_type: 'apartment',
    deposit_amount: '',
    lease_term_months: 12,
    utilities_included: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to add a property');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Property title is required');
      }
      if (!formData.price || parseInt(formData.price) <= 0) {
        throw new Error('Valid price is required');
      }
      if (!formData.address.trim()) {
        throw new Error('Address is required');
      }
      if (!formData.city.trim()) {
        throw new Error('City is required');
      }
      if (!formData.state.trim()) {
        throw new Error('State is required');
      }
      if (!formData.zip_code.trim()) {
        throw new Error('ZIP code is required');
      }

      const propertyData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: parseInt(formData.price),
        bedrooms: formData.bedrooms,
        bathrooms: parseFloat(formData.bathrooms.toString()),
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        amenities: formData.amenities.filter(a => a.trim() !== ''),
        pet_friendly: formData.pet_friendly,
        furnished: formData.furnished,
        parking_included: formData.parking_included,
        available_date: formData.available_date,
        property_type: formData.property_type,
        deposit_amount: formData.deposit_amount ? parseInt(formData.deposit_amount) : null,
        lease_term_months: formData.lease_term_months,
        utilities_included: formData.utilities_included.filter(u => u.trim() !== ''),
        status: 'available',
        landlord_id: user.id
      };

      console.log('Creating property with data:', propertyData);

      const result = await createProperty(propertyData);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to create property');
      }
    } catch (err) {
      console.error('Property creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const addArrayItem = (field: 'amenities' | 'utilities_included') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'amenities' | 'utilities_included', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: 'amenities' | 'utilities_included', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Property</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Modern Downtown Apartment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="2500"
              />
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
            <select
              value={formData.property_type}
              onChange={(e) => handleInputChange('property_type', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="studio">Studio</option>
              <option value="loft">Loft</option>
            </select>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Seattle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="WA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="98101"
                />
              </div>
            </div>
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('bedrooms', Math.max(0, formData.bedrooms - 1))}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold w-8 text-center">{formData.bedrooms}</span>
                <button
                  type="button"
                  onClick={() => handleInputChange('bedrooms', formData.bedrooms + 1)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('bathrooms', Math.max(0, formData.bathrooms - 0.5))}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold w-8 text-center">{formData.bathrooms}</span>
                <button
                  type="button"
                  onClick={() => handleInputChange('bathrooms', formData.bathrooms + 0.5)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe your property..."
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="space-y-2">
              {formData.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={amenity}
                    onChange={(e) => updateArrayItem('amenities', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Gym, Pool, Parking"
                  />
                  {formData.amenities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('amenities', index)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('amenities')}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Amenity
              </button>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
            <div className="space-y-2">
              {[
                { key: 'pet_friendly', label: 'Pet-Friendly' },
                { key: 'furnished', label: 'Furnished' },
                { key: 'parking_included', label: 'Parking Included' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => handleInputChange(key, e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
              <input
                type="number"
                min="1"
                value={formData.square_feet}
                onChange={(e) => handleInputChange('square_feet', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit ($)</label>
              <input
                type="number"
                min="0"
                value={formData.deposit_amount}
                onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="2500"
              />
            </div>
          </div>

          {/* Lease Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lease Term (months)</label>
            <select
              value={formData.lease_term_months}
              onChange={(e) => handleInputChange('lease_term_months', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={18}>18 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>

          {/* Utilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Utilities Included</label>
            <div className="space-y-2">
              {formData.utilities_included.map((utility, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={utility}
                    onChange={(e) => updateArrayItem('utilities_included', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Water, Electricity, Internet"
                  />
                  {formData.utilities_included.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('utilities_included', index)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('utilities_included')}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Utility
              </button>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Date</label>
            <input
              type="date"
              value={formData.available_date}
              onChange={(e) => handleInputChange('available_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Creating Property...
              </>
            ) : (
              'Add Property'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyForm;