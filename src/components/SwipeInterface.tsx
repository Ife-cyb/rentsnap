import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { useProperties } from '../hooks/useProperties';
import { useInteractions } from '../hooks/useInteractions';
import { useMatchScores } from '../hooks/useMatchScores';
import PropertyCard from './PropertyCard';
import AuthModal from './AuthModal';
import LandlordDashboard from './LandlordDashboard';
import SearchInterface from './SearchInterface';
import { X, Heart, Rotate3D, Loader, Search } from 'lucide-react';

const SwipeInterface: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();
  const { properties, loading: propertiesLoading, loadMore, hasMore } = useProperties();
  const { likeProperty, passProperty, viewProperty } = useInteractions();
  const { getPropertyMatchScore } = useMatchScores();
  const { currentPropertyIndex, nextProperty, resetPropertyIndex } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Get user mode from profile
  const userMode = profile?.user_type || 'tenant';

  // Memoize current and next properties to prevent unnecessary re-renders
  const currentProperty = useMemo(() => properties[currentPropertyIndex], [properties, currentPropertyIndex]);
  const nextPropertyData = useMemo(() => properties[currentPropertyIndex + 1], [properties, currentPropertyIndex]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated]);

  // Load more properties when approaching the end
  useEffect(() => {
    if (properties.length > 0 && currentPropertyIndex >= properties.length - 3 && hasMore && !propertiesLoading) {
      loadMore();
    }
  }, [currentPropertyIndex, properties.length, hasMore, propertiesLoading, loadMore]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProperty) return;

    // Optimistically update UI first
    nextProperty();

    // Then handle backend operations asynchronously
    try {
      // Record view interaction (fire and forget)
      viewProperty(currentProperty.id).catch(console.error);

      if (direction === 'right') {
        likeProperty(currentProperty.id).catch(console.error);
      } else {
        passProperty(currentProperty.id).catch(console.error);
      }
    } catch (err) {
      console.error('Error handling swipe:', err);
    }
  };

  const handlePass = () => {
    if (currentProperty) {
      handleSwipe('left');
    }
  };

  const handleLike = () => {
    if (currentProperty) {
      handleSwipe('right');
    }
  };

  const handleReset = () => {
    resetPropertyIndex();
  };

  if (!isAuthenticated) {
    return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
  }

  // Show landlord dashboard for landlords
  if (userMode === 'landlord') {
    return <LandlordDashboard />;
  }

  // Show search interface if search is active
  if (showSearch) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button
            onClick={() => setShowSearch(false)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Search Properties</h2>
        </div>
        <SearchInterface onPropertySelect={() => setShowSearch(false)} />
      </div>
    );
  }

  if (propertiesLoading && properties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (!currentProperty && !propertiesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-12 h-12 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No More Properties!</h3>
          <p className="text-gray-600 mb-6">You've seen all available properties in your area.</p>
          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="bg-purple-500 text-white px-6 py-3 rounded-full font-medium hover:bg-purple-600 transition-colors flex items-center mx-auto"
            >
              <Rotate3D className="w-5 h-5 mr-2" />
              Reset & Browse Again
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-white text-purple-600 border border-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-colors flex items-center mx-auto"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Memoize property with score to prevent recalculation
  const propertyWithScore = useMemo(() => currentProperty ? ({
    ...currentProperty,
    matchScore: getPropertyMatchScore(currentProperty.id)
  }) : null, [currentProperty, getPropertyMatchScore]);

  const nextPropertyWithScore = useMemo(() => nextPropertyData ? ({
    ...nextPropertyData,
    matchScore: getPropertyMatchScore(nextPropertyData.id)
  }) : null, [nextPropertyData, getPropertyMatchScore]);

  return (
    <div className="flex-1 relative bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Search Button */}
      <button
        onClick={() => setShowSearch(true)}
        className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
      >
        <Search className="w-5 h-5 text-gray-700" />
      </button>

      {/* Cards Container */}
      <div className="absolute inset-4 md:inset-8">
        {/* Next Property (Background) */}
        {nextPropertyWithScore && (
          <div className="absolute w-full h-full transform scale-95 opacity-50">
            <PropertyCard
              property={nextPropertyWithScore}
              onSwipe={() => {}}
              isActive={false}
            />
          </div>
        )}

        {/* Current Property (Foreground) */}
        {propertyWithScore && (
          <PropertyCard
            property={propertyWithScore}
            onSwipe={handleSwipe}
            isActive={true}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={handlePass}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Pass on this property"
        >
          <X className="w-6 h-6 text-red-500" />
        </button>
        <button
          onClick={handleLike}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Like this property"
        >
          <Heart className="w-6 h-6 text-green-500" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-sm font-medium text-gray-700">
          {currentPropertyIndex + 1} / {properties.length}{hasMore ? '+' : ''}
        </span>
      </div>

      {/* Loading indicator for more properties */}
      {propertiesLoading && properties.length > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="flex items-center space-x-2">
            <Loader className="w-4 h-4 text-purple-500 animate-spin" />
            <span className="text-sm text-gray-700">Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeInterface;