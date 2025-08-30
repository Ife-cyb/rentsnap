import React, { useState, useEffect } from 'react';
import { useLandlordProperties } from '../hooks/useProperties';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/supabase';
import { 
  Home, Plus, Eye, MessageCircle, TrendingUp, Calendar, 
  DollarSign, Users, Edit, Trash2, MoreVertical, Star,
  Heart, MapPin, Bed, Bath, Car, Loader, AlertCircle
} from 'lucide-react';

const LandlordDashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties, loading, error, updateProperty, deleteProperty, refetch } = useLandlordProperties();
  const [analytics, setAnalytics] = useState<{ [key: string]: any }>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    if (properties.length > 0) {
      loadAnalytics();
    }
  }, [properties]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    const analyticsData: { [key: string]: any } = {};
    
    for (const property of properties) {
      try {
        const { data } = await db.getPropertyAnalytics(property.id);
        if (data) {
          const views = data.filter(i => i.interaction_type === 'view').length;
          const likes = data.filter(i => i.interaction_type === 'like').length;
          const inquiries = property.conversations?.length || 0;
          
          analyticsData[property.id] = {
            views,
            likes,
            inquiries,
            engagement: views > 0 ? ((likes + inquiries) / views * 100).toFixed(1) : 0
          };
        }
      } catch (err) {
        console.error('Error loading analytics for property:', property.id, err);
      }
    }
    
    setAnalytics(analyticsData);
    setLoadingAnalytics(false);
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    const result = await updateProperty(propertyId, { status: newStatus });
    if (result.success) {
      await refetch();
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      const result = await deleteProperty(propertyId);
      if (result.success) {
        await refetch();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;
  const totalViews = Object.values(analytics).reduce((sum: number, data: any) => sum + (data.views || 0), 0);
  const totalLikes = Object.values(analytics).reduce((sum: number, data: any) => sum + (data.likes || 0), 0);
  const totalInquiries = Object.values(analytics).reduce((sum: number, data: any) => sum + (data.inquiries || 0), 0);

  if (loading && properties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Properties</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h2>
            <p className="text-gray-600">Manage your properties and track performance</p>
          </div>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableProperties}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rented</p>
                <p className="text-2xl font-bold text-blue-600">{rentedProperties}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-orange-600">{totalViews}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalLikes}</p>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
              <p className="text-sm text-gray-600">Inquiries</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalViews > 0 ? ((totalLikes + totalInquiries) / totalViews * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-gray-600">Engagement Rate</p>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Properties</h3>
          </div>
          
          {properties.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first property to attract tenants.</p>
              <button className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center mx-auto">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {properties.map((property) => {
                const propertyAnalytics = analytics[property.id] || {};
                const primaryImage = property.property_images?.find(img => img.is_primary)?.image_url ||
                                   property.property_images?.[0]?.image_url ||
                                   'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400';

                return (
                  <div key={property.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Property Image */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={primaryImage}
                          alt={property.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Property Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h4>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">{property.city}, {property.state}</span>
                            </div>
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center text-gray-600">
                                <Bed className="w-4 h-4 mr-1" />
                                <span className="text-sm">{property.bedrooms}</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Bath className="w-4 h-4 mr-1" />
                                <span className="text-sm">{property.bathrooms}</span>
                              </div>
                              {property.parking_included && (
                                <div className="flex items-center text-gray-600">
                                  <Car className="w-4 h-4 mr-1" />
                                  <span className="text-sm">Parking</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() => setSelectedProperty(selectedProperty === property.id ? null : property.id)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {selectedProperty === property.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Property
                                  </button>
                                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </button>
                                  <div className="border-t border-gray-200">
                                    <select
                                      value={property.status}
                                      onChange={(e) => handleStatusChange(property.id, e.target.value)}
                                      className="w-full px-4 py-2 border-0 bg-transparent focus:ring-0"
                                    >
                                      <option value="available">Available</option>
                                      <option value="pending">Pending</option>
                                      <option value="rented">Rented</option>
                                      <option value="draft">Draft</option>
                                    </select>
                                  </div>
                                  <div className="border-t border-gray-200">
                                    <button
                                      onClick={() => handleDeleteProperty(property.id)}
                                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Property
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price and Analytics */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-purple-600">
                              ${property.price.toLocaleString()}
                            </span>
                            <span className="text-gray-500 ml-1">/month</span>
                          </div>
                          
                          {!loadingAnalytics && propertyAnalytics && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                <span>{propertyAnalytics.views || 0} views</span>
                              </div>
                              <div className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                <span>{propertyAnalytics.likes || 0} likes</span>
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                <span>{propertyAnalytics.inquiries || 0} inquiries</span>
                              </div>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-1" />
                                <span>{propertyAnalytics.engagement || 0}% engagement</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;