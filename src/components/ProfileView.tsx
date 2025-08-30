import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInteractions } from '../hooks/useInteractions';
import { usePreferences } from '../hooks/usePreferences';
import { useStore } from '../store/useStore';
import { 
  User, Settings, Bell, Shield, Heart, MapPin, DollarSign, Edit3, LogOut, 
  Loader, AlertCircle, Camera, Save, X, Phone, Mail, Calendar, Home,
  Eye, EyeOff, Trash2, Upload, Check
} from 'lucide-react';

const ProfileView: React.FC = () => {
  const { user, profile, signOut, updateProfile, uploadAvatar, loading: authLoading, error: authError, supabaseConfigured } = useAuth();
  const { userMode } = useStore();
  const { likedProperties, loading: interactionsLoading } = useInteractions();
  const { preferences, loading: preferencesLoading, updatePreferences } = usePreferences();
  
  // UI State
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'account' | 'privacy'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Profile editing state
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });

  // Preferences editing state
  const [editedPreferences, setEditedPreferences] = useState({
    budget_min: 1000,
    budget_max: 5000,
    preferred_bedrooms: [1, 2],
    search_radius: 10,
    preferred_amenities: [''],
    pet_friendly: false,
    furnished_preferred: false,
    parking_required: false,
    location_name: ''
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    notifications: {
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      new_matches: true,
      messages: true,
      property_updates: true
    },
    privacy: {
      profile_visibility: 'public',
      show_phone: true,
      show_email: false,
      allow_contact: true
    }
  });

  // Update edited profile when profile data loads
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Update edited preferences when preferences data loads
  useEffect(() => {
    if (preferences) {
      setEditedPreferences({
        budget_min: preferences.budget_min || 1000,
        budget_max: preferences.budget_max || 5000,
        preferred_bedrooms: preferences.preferred_bedrooms || [1, 2],
        search_radius: preferences.search_radius || 10,
        preferred_amenities: preferences.preferred_amenities?.length > 0 ? preferences.preferred_amenities : [''],
        pet_friendly: preferences.pet_friendly || false,
        furnished_preferred: preferences.furnished_preferred || false,
        parking_required: preferences.parking_required || false,
        location_name: preferences.location_name || ''
      });
    }
  }, [preferences]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    clearMessages();

    try {
      const result = await uploadAvatar(file);
      
      if (result.success) {
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        
        // Update the edited profile state with the new avatar URL
        setEditedProfile(prev => ({
          ...prev,
          avatar_url: result.data.url
        }));
      } else {
        setError(result.error || 'Failed to upload avatar');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const result = await updateProfile(editedProfile);
      if (result.success) {
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const cleanedPreferences = {
        ...editedPreferences,
        preferred_amenities: editedPreferences.preferred_amenities.filter(a => a.trim() !== '')
      };
      
      const result = await updatePreferences(cleanedPreferences);
      if (result.success) {
        setSuccess('Preferences updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const addAmenity = () => {
    setEditedPreferences(prev => ({
      ...prev,
      preferred_amenities: [...prev.preferred_amenities, '']
    }));
  };

  const removeAmenity = (index: number) => {
    setEditedPreferences(prev => ({
      ...prev,
      preferred_amenities: prev.preferred_amenities.filter((_, i) => i !== index)
    }));
  };

  const updateAmenity = (index: number, value: string) => {
    setEditedPreferences(prev => ({
      ...prev,
      preferred_amenities: prev.preferred_amenities.map((item, i) => i === index ? value : item)
    }));
  };

  const toggleBedroom = (bedrooms: number) => {
    setEditedPreferences(prev => ({
      ...prev,
      preferred_bedrooms: prev.preferred_bedrooms.includes(bedrooms)
        ? prev.preferred_bedrooms.filter(b => b !== bedrooms)
        : [...prev.preferred_bedrooms, bedrooms]
    }));
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an auth error
  if (authError && !supabaseConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Setup Required</h3>
          <p className="text-gray-600 mb-4">
            Please click "Connect to Supabase" in the top right to set up your database connection.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              This will enable profile management and all app features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for other auth errors
  if (authError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if no user is logged in
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Signed In</h3>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Calculate stats with fallbacks
  const stats = userMode === 'tenant' 
    ? [
        { label: 'Properties Liked', value: likedProperties?.length || 0, icon: Heart },
        { label: 'Messages Sent', value: 0, icon: User }, // Placeholder
        { label: 'Profile Views', value: 0, icon: Settings } // Placeholder
      ]
    : [
        { label: 'Properties Listed', value: 0, icon: Heart }, // Placeholder
        { label: 'Inquiries Received', value: 0, icon: User }, // Placeholder
        { label: 'Active Listings', value: 0, icon: Settings } // Placeholder
      ];

  const navigationItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings, show: userMode === 'tenant' },
    { id: 'account', label: 'Account', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ].filter(item => item.show !== false);

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center ${
            success ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {success ? <Check className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            <span>{success || error}</span>
            <button
              onClick={clearMessages}
              className="ml-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="relative">
                <img
                  src={editedProfile.avatar_url || profile?.avatar_url || 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={profile?.full_name || user.email || 'User'}
                  className="w-20 h-20 rounded-full mr-4 object-cover"
                  loading="lazy"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-4 bg-purple-500 text-white p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors">
                    {uploadingAvatar ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || user.email || 'User'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
                  {profile?.user_type === 'landlord' ? 'Landlord' : 'Tenant'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Edit profile"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 mb-6">
          <div className="flex space-x-1">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'profile' && (
          <div className="bg-white rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.full_name}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile?.full_name || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{user.email}</span>
                  <span className="ml-auto text-xs text-gray-500">Verified</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile?.phone || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl">
                    <p className="text-gray-900">{profile?.bio || 'No bio added yet'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'preferences' && userMode === 'tenant' && (
          <div className="bg-white rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Search Preferences</h3>
              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </button>
            </div>

            <div className="space-y-6">
              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Budget Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                    <input
                      type="number"
                      value={editedPreferences.budget_min}
                      onChange={(e) => setEditedPreferences(prev => ({ ...prev, budget_min: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                    <input
                      type="number"
                      value={editedPreferences.budget_max}
                      onChange={(e) => setEditedPreferences(prev => ({ ...prev, budget_max: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  ${editedPreferences.budget_min.toLocaleString()} - ${editedPreferences.budget_max.toLocaleString()} per month
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Bedrooms</label>
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => toggleBedroom(num)}
                      className={`w-12 h-12 rounded-full font-medium transition-colors ${
                        editedPreferences.preferred_bedrooms.includes(num)
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Search Radius</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={editedPreferences.search_radius}
                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, search_radius: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>1 mile</span>
                  <span className="font-medium">{editedPreferences.search_radius} miles</span>
                  <span>50 miles</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
                <input
                  type="text"
                  value={editedPreferences.location_name}
                  onChange={(e) => setEditedPreferences(prev => ({ ...prev, location_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Downtown Seattle, Capitol Hill"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Amenities</label>
                <div className="space-y-2">
                  {editedPreferences.preferred_amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={amenity}
                        onChange={(e) => updateAmenity(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Gym, Pool, Parking"
                      />
                      {editedPreferences.preferred_amenities.length > 1 && (
                        <button
                          onClick={() => removeAmenity(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addAmenity}
                    className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Add Amenity
                  </button>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
                <div className="space-y-3">
                  {[
                    { key: 'pet_friendly', label: 'Pet-Friendly', icon: Heart },
                    { key: 'furnished_preferred', label: 'Furnished', icon: Home },
                    { key: 'parking_required', label: 'Parking Required', icon: Settings }
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedPreferences[key as keyof typeof editedPreferences] as boolean}
                        onChange={(e) => setEditedPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <Icon className="w-5 h-5 text-gray-400 ml-3 mr-2" />
                      <span className="text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
            
            <div className="space-y-6">
              {/* Notifications */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications' },
                    { key: 'push_notifications', label: 'Push Notifications' },
                    { key: 'new_matches', label: 'New Property Matches' },
                    { key: 'messages', label: 'New Messages' },
                    { key: 'property_updates', label: 'Property Updates' },
                    { key: 'marketing_emails', label: 'Marketing Emails' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between">
                      <span className="text-gray-900">{label}</span>
                      <input
                        type="checkbox"
                        checked={accountSettings.notifications[key as keyof typeof accountSettings.notifications]}
                        onChange={(e) => setAccountSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [key]: e.target.checked
                          }
                        }))}
                        className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Actions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Account Actions</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-900">Change Password</span>
                    </div>
                    <span className="text-purple-600 text-sm font-medium">Update</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-900">Change Email</span>
                    </div>
                    <span className="text-purple-600 text-sm font-medium">Update</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600">
                    <div className="flex items-center">
                      <Trash2 className="w-5 h-5 mr-3" />
                      <span>Delete Account</span>
                    </div>
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy Settings</h3>
            
            <div className="space-y-6">
              {/* Profile Visibility */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Profile Visibility</h4>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public - Anyone can see your profile' },
                    { value: 'private', label: 'Private - Only you can see your profile' },
                    { value: 'contacts', label: 'Contacts Only - Only people you message can see your profile' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value={value}
                        checked={accountSettings.privacy.profile_visibility === value}
                        onChange={(e) => setAccountSettings(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            profile_visibility: e.target.value
                          }
                        }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-3 text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-3">
                  {[
                    { key: 'show_phone', label: 'Show Phone Number' },
                    { key: 'show_email', label: 'Show Email Address' },
                    { key: 'allow_contact', label: 'Allow Contact from Other Users' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between">
                      <span className="text-gray-900">{label}</span>
                      <input
                        type="checkbox"
                        checked={accountSettings.privacy[key as keyof typeof accountSettings.privacy] as boolean}
                        onChange={(e) => setAccountSettings(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            [key]: e.target.checked
                          }
                        }))}
                        className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Data & Privacy */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Data & Privacy</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-900">Download My Data</span>
                    </div>
                    <span className="text-purple-600 text-sm font-medium">Export</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center">
                      <Eye className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-900">Privacy Policy</span>
                    </div>
                    <span className="text-purple-600 text-sm font-medium">View</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-900">Terms of Service</span>
                    </div>
                    <span className="text-purple-600 text-sm font-medium">View</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;