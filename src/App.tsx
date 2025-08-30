import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabaseConfigured } from './lib/supabase';
import NavigationBar from './components/NavigationBar';
import AuthModal from './components/AuthModal';
import { Zap, Loader, AlertCircle } from 'lucide-react';

// Lazy load components for better performance
const SwipeInterface = lazy(() => import('./components/SwipeInterface'));
const SavedProperties = lazy(() => import('./components/SavedProperties'));
const MessagesView = lazy(() => import('./components/MessagesView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const FilterPanel = lazy(() => import('./components/FilterPanel'));
const AddPropertyForm = lazy(() => import('./components/AddPropertyForm'));
const AffordableHousingPortal = lazy(() => import('./components/AffordableHousingPortal'));
const NeighborhoodInsights = lazy(() => import('./components/NeighborhoodInsights'));
const LocalBusinessDirectory = lazy(() => import('./components/LocalBusinessDirectory'));
const SmartRoommateMatch = lazy(() => import('./components/SmartRoommateMatch'));
const VideoTours = lazy(() => import('./components/VideoTours'));
const LiveVirtualShowings = lazy(() => import('./components/LiveVirtualShowings'));
const VisualStories = lazy(() => import('./components/VisualStories'));
const SmartNotifications = lazy(() => import('./components/SmartNotifications'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const TrustVerification = lazy(() => import('./components/TrustVerification'));
const QuickApply = lazy(() => import('./components/QuickApply'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, loading: authLoading, profile, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get user mode from profile, default to tenant if not set
  const userMode = profile?.user_type || 'tenant';

  // Check if we have network/timeout errors
  const hasNetworkError = authError && (
    authError.includes('timeout') || 
    authError.includes('AbortError') || 
    authError.includes('Failed to fetch') ||
    authError.includes('signal is aborted')
  );

  useEffect(() => {
    // Only show auth modal if Supabase is configured and user is not authenticated and no network errors
    if (!authLoading && !isAuthenticated && supabaseConfigured && !hasNetworkError) {
      setShowAuthModal(true);
    }
  }, [authLoading, isAuthenticated, hasNetworkError]);

  // Show loading only for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RentSnap</h1>
          <p className="text-gray-600">Loading your rental experience...</p>
        </div>
      </div>
    );
  }

  // Show database setup message if Supabase is not configured OR if there are network errors
  if (!supabaseConfigured || hasNetworkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">RentSnap</h1>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            {hasNetworkError ? (
              <>
                <div className="flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Authentication Error</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Unable to connect to the database. Please check your Supabase configuration and internet connection.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    Network timeout detected. Please ensure Supabase is properly configured and accessible.
                  </p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Retry Connection
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Database Setup Required</h2>
                <p className="text-gray-600 mb-4">
                  To get started with RentSnap, please click the "Connect to Supabase" button in the top right to set up your database connection.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    This will enable user authentication, property listings, and all app features.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return <div className="flex-1" />; // Auth modal will handle this
    }

    if (showAddProperty) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AddPropertyForm onClose={() => setShowAddProperty(false)} />
        </Suspense>
      );
    }

    switch (activeTab) {
      case 'discover':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SwipeInterface />
          </Suspense>
        );
      case 'saved':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SavedProperties />
          </Suspense>
        );
      case 'messages':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MessagesView />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileView />
          </Suspense>
        );
      case 'affordable-housing':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AffordableHousingPortal />
          </Suspense>
        );
      case 'neighborhood-insights':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NeighborhoodInsights />
          </Suspense>
        );
      case 'local-business':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <LocalBusinessDirectory />
          </Suspense>
        );
      case 'roommate-match':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SmartRoommateMatch />
          </Suspense>
        );
      case 'video-tours':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <VideoTours />
          </Suspense>
        );
      case 'virtual-showings':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <LiveVirtualShowings isHost={userMode === 'landlord'} />
          </Suspense>
        );
      case 'stories':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <VisualStories />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SmartNotifications />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsDashboard />
          </Suspense>
        );
      case 'verification':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TrustVerification />
          </Suspense>
        );
      case 'quick-apply':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <QuickApply />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SwipeInterface />
          </Suspense>
        );
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'add-property') {
      setShowAddProperty(true);
    } else {
      setActiveTab(tab);
      setShowAddProperty(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-area-pt">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RentSnap</h1>
          </div>
          {isAuthenticated && profile && (
            <span className="text-sm font-medium text-purple-600 capitalize">
              {profile.user_type === 'landlord' ? 'Landlord' : 'Tenant'}
            </span>
          )}
        </div>
      </header>

      {/* Visual Stories */}
      {isAuthenticated && (
        <Suspense fallback={null}>
          <VisualStories />
        </Suspense>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>

      {/* Filter Panel - Only show for tenants */}
      {isAuthenticated && userMode === 'tenant' && (
        <Suspense fallback={null}>
          <FilterPanel />
        </Suspense>
      )}

      {/* Navigation */}
      {isAuthenticated && (
        <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

export default App;