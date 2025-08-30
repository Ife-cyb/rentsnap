import React from 'react';
import { useInteractions } from '../hooks/useInteractions';
import { useMessages } from '../hooks/useMessages';
import { Heart, MapPin, Bed, Bath, Star, MessageCircle, Loader } from 'lucide-react';

const SavedProperties: React.FC = () => {
  const { likedProperties, loading } = useInteractions();
  const { createConversation } = useMessages();

  const handleContact = async (property: any) => {
    if (property.landlord_id) {
      const result = await createConversation(property.id, property.landlord_id);
      if (result.success) {
        // Navigate to messages or show success
        console.log('Conversation created successfully');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading saved properties...</p>
        </div>
      </div>
    );
  }

  if (likedProperties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Properties</h3>
          <p className="text-gray-600">Heart properties you love to save them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Properties</h2>
        
        <div className="space-y-4">
          {likedProperties.map((property) => {
            const primaryImage = property.property_images?.find(img => img.is_primary)?.image_url ||
                               property.property_images?.[0]?.image_url ||
                               'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800';

            return (
              <div key={property.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex">
                  {/* Property Image */}
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={primaryImage}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
                      <span className="text-lg font-bold text-purple-600">
                        ${property.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.city}, {property.state}</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center text-gray-600">
                        <Bed className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Bath className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Star className="w-4 h-4 mr-1" />
                        <span className="text-sm">4.8</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600 font-medium">
                        Available {new Date(property.available_date).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => handleContact(property)}
                        className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-600 transition-colors flex items-center"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SavedProperties;