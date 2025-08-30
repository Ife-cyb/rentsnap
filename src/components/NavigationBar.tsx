import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInteractions } from '../hooks/useInteractions';
import { 
  Home, Heart, MessageCircle, User, Plus, Sliders, 
  Building, MapPin, Users, Video, Bell, BarChart3, 
  Shield, FileText, Menu, X
} from 'lucide-react';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  const { profile } = useAuth();
  const { likedProperties } = useInteractions();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Get user mode from profile, default to tenant if not set
  const userMode = profile?.user_type || 'tenant';

  const mainTabs = [
    { id: 'discover', label: 'Discover', icon: Home },
    { id: 'saved', label: 'Saved', icon: Heart, badge: likedProperties.length },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const tenantFeatures = [
    { id: 'affordable-housing', label: 'Affordable Housing', icon: Building },
    { id: 'neighborhood-insights', label: 'Neighborhood Insights', icon: MapPin },
    { id: 'local-business', label: 'Local Business', icon: Building },
    { id: 'roommate-match', label: 'Roommate Match', icon: Users },
    { id: 'video-tours', label: 'Video Tours', icon: Video },
    { id: 'virtual-showings', label: 'Virtual Showings', icon: Video },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'quick-apply', label: 'Quick Apply', icon: FileText }
  ];

  const landlordFeatures = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'virtual-showings', label: 'Virtual Showings', icon: Video },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'verification', label: 'Verification', icon: Shield }
  ];

  const moreFeatures = userMode === 'tenant' ? tenantFeatures : landlordFeatures;

  return (
    <>
      <div className="bg-white border-t border-gray-200 safe-area-pb">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-around py-2">
          {mainTabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center space-y-1 p-2 relative ${
                activeTab === id ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {badge && badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}

          {/* Action Button */}
          {userMode === 'landlord' ? (
            <button
              onClick={() => onTabChange('add-property')}
              className="flex flex-col items-center space-y-1 p-2 text-purple-600"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const { toggleFilters } = require('../store/useStore').useStore.getState();
                toggleFilters();
              }}
              className="flex flex-col items-center space-y-1 p-2 text-purple-600"
            >
              <Sliders className="w-6 h-6" />
              <span className="text-xs font-medium">Filters</span>
            </button>
          )}

          {/* More Menu */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center space-y-1 p-2 text-gray-400"
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More Features Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">More Features</h2>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {moreFeatures.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onTabChange(id);
                    setShowMoreMenu(false);
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-colors ${
                    activeTab === id
                      ? 'border-purple-500 bg-purple-50 text-purple-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium text-center">{label}</span>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {userMode === 'tenant' ? (
                  <>
                    <button
                      onClick={() => {
                        onTabChange('quick-apply');
                        setShowMoreMenu(false);
                      }}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
                    >
                      Quick Apply to Properties
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('roommate-match');
                        setShowMoreMenu(false);
                      }}
                      className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                    >
                      Find Roommates
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onTabChange('add-property');
                        setShowMoreMenu(false);
                      }}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
                    >
                      Add New Property
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('analytics');
                        setShowMoreMenu(false);
                      }}
                      className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                    >
                      View Analytics
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;