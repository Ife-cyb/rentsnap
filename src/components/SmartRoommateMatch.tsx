import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/supabase';
import { 
  Users, Heart, X, MessageCircle, Star, MapPin, DollarSign, 
  Calendar, Coffee, Music, Dumbbell, Book, Gamepad2, 
  Cigarette, Wine, Dog, Cat, Loader, Filter, Search
} from 'lucide-react';

interface RoommateProfile {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  occupation: string;
  budget_min: number;
  budget_max: number;
  preferred_location: string;
  move_in_date: string;
  lease_length: number;
  lifestyle: {
    cleanliness: number; // 1-5 scale
    noise_level: number; // 1-5 scale
    social_level: number; // 1-5 scale
    work_schedule: 'day' | 'night' | 'flexible';
    smoking: boolean;
    drinking: 'never' | 'occasionally' | 'socially' | 'regularly';
    pets: string[];
    interests: string[];
  };
  preferences: {
    age_range: { min: number; max: number };
    gender_preference: 'any' | 'male' | 'female';
    occupation_types: string[];
    lifestyle_compatibility: number; // minimum compatibility score
  };
  bio: string;
  photos: string[];
  verification_status: {
    identity: boolean;
    income: boolean;
    background_check: boolean;
  };
  created_at: string;
  match_score?: number;
}

const SmartRoommateMatch: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<RoommateProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<RoommateProfile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [matches, setMatches] = useState<RoommateProfile[]>([]);
  const [userProfile, setUserProfile] = useState<RoommateProfile | null>(null);

  useEffect(() => {
    loadRoommateProfiles();
    checkUserProfile();
  }, [user]);

  const loadRoommateProfiles = async () => {
    setLoading(true);
    try {
      // Mock roommate profiles - in a real app, this would come from the database
      const mockProfiles: RoommateProfile[] = [
        {
          id: '1',
          user_id: 'user1',
          full_name: 'Sarah Chen',
          age: 26,
          occupation: 'Software Engineer',
          budget_min: 1200,
          budget_max: 1800,
          preferred_location: 'Capitol Hill, Seattle',
          move_in_date: '2024-02-01',
          lease_length: 12,
          lifestyle: {
            cleanliness: 4,
            noise_level: 2,
            social_level: 3,
            work_schedule: 'day',
            smoking: false,
            drinking: 'socially',
            pets: [],
            interests: ['reading', 'hiking', 'cooking', 'yoga']
          },
          preferences: {
            age_range: { min: 22, max: 32 },
            gender_preference: 'any',
            occupation_types: ['professional', 'student'],
            lifestyle_compatibility: 70
          },
          bio: 'Clean, quiet professional looking for a like-minded roommate. I love cooking and would enjoy sharing meals together!',
          photos: ['https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'],
          verification_status: {
            identity: true,
            income: true,
            background_check: true
          },
          created_at: '2024-01-15',
          match_score: 92
        },
        {
          id: '2',
          user_id: 'user2',
          full_name: 'Alex Rodriguez',
          age: 24,
          occupation: 'Graduate Student',
          budget_min: 800,
          budget_max: 1400,
          preferred_location: 'University District, Seattle',
          move_in_date: '2024-03-01',
          lease_length: 9,
          lifestyle: {
            cleanliness: 3,
            noise_level: 3,
            social_level: 4,
            work_schedule: 'flexible',
            smoking: false,
            drinking: 'occasionally',
            pets: ['cat'],
            interests: ['gaming', 'music', 'movies', 'basketball']
          },
          preferences: {
            age_range: { min: 20, max: 28 },
            gender_preference: 'any',
            occupation_types: ['student', 'professional'],
            lifestyle_compatibility: 60
          },
          bio: 'Grad student studying computer science. Pretty laid back, love gaming and music. Have a friendly cat named Pixel!',
          photos: ['https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'],
          verification_status: {
            identity: true,
            income: false,
            background_check: true
          },
          created_at: '2024-01-10',
          match_score: 78
        },
        {
          id: '3',
          user_id: 'user3',
          full_name: 'Emma Thompson',
          age: 28,
          occupation: 'Marketing Manager',
          budget_min: 1500,
          budget_max: 2200,
          preferred_location: 'Belltown, Seattle',
          move_in_date: '2024-01-15',
          lease_length: 12,
          lifestyle: {
            cleanliness: 5,
            noise_level: 1,
            social_level: 2,
            work_schedule: 'day',
            smoking: false,
            drinking: 'never',
            pets: [],
            interests: ['fitness', 'meditation', 'healthy cooking', 'photography']
          },
          preferences: {
            age_range: { min: 25, max: 35 },
            gender_preference: 'female',
            occupation_types: ['professional'],
            lifestyle_compatibility: 80
          },
          bio: 'Health-conscious professional seeking a clean, quiet living environment. Early riser who values wellness and organization.',
          photos: ['https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'],
          verification_status: {
            identity: true,
            income: true,
            background_check: true
          },
          created_at: '2024-01-12',
          match_score: 85
        }
      ];

      setProfiles(mockProfiles);
      setCurrentProfile(mockProfiles[0]);
    } catch (error) {
      console.error('Error loading roommate profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserProfile = async () => {
    // Check if user has a roommate profile
    // In a real app, this would query the database
    setUserProfile(null);
  };

  const calculateCompatibility = (profile1: RoommateProfile, profile2: RoommateProfile): number => {
    let score = 0;
    let factors = 0;

    // Lifestyle compatibility
    const cleanlinessScore = 100 - Math.abs(profile1.lifestyle.cleanliness - profile2.lifestyle.cleanliness) * 20;
    const noiseScore = 100 - Math.abs(profile1.lifestyle.noise_level - profile2.lifestyle.noise_level) * 20;
    const socialScore = 100 - Math.abs(profile1.lifestyle.social_level - profile2.lifestyle.social_level) * 15;
    
    score += cleanlinessScore + noiseScore + socialScore;
    factors += 3;

    // Budget compatibility
    const budgetOverlap = Math.min(profile1.budget_max, profile2.budget_max) - Math.max(profile1.budget_min, profile2.budget_min);
    const budgetScore = budgetOverlap > 0 ? 100 : 0;
    score += budgetScore;
    factors += 1;

    // Interest overlap
    const commonInterests = profile1.lifestyle.interests.filter(interest => 
      profile2.lifestyle.interests.includes(interest)
    ).length;
    const interestScore = (commonInterests / Math.max(profile1.lifestyle.interests.length, profile2.lifestyle.interests.length)) * 100;
    score += interestScore;
    factors += 1;

    // Age compatibility
    const ageCompatible = profile1.age >= profile2.preferences.age_range.min && 
                         profile1.age <= profile2.preferences.age_range.max;
    if (ageCompatible) score += 100;
    factors += 1;

    return Math.round(score / factors);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return;

    if (direction === 'right') {
      // Add to matches
      setMatches(prev => [...prev, currentProfile]);
    }

    // Move to next profile
    const nextIndex = currentIndex + 1;
    if (nextIndex < profiles.length) {
      setCurrentIndex(nextIndex);
      setCurrentProfile(profiles[nextIndex]);
    } else {
      setCurrentProfile(null);
    }
  };

  const getLifestyleIcon = (interest: string) => {
    const icons: { [key: string]: any } = {
      reading: Book,
      gaming: Gamepad2,
      music: Music,
      fitness: Dumbbell,
      cooking: Coffee,
      hiking: MapPin,
      yoga: Heart,
      movies: Star,
      basketball: Dumbbell,
      meditation: Heart,
      photography: Star
    };
    return icons[interest] || Star;
  };

  const getVerificationBadges = (verification: RoommateProfile['verification_status']) => {
    const badges = [];
    if (verification.identity) badges.push('ID Verified');
    if (verification.income) badges.push('Income Verified');
    if (verification.background_check) badges.push('Background Check');
    return badges;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading roommate profiles...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Perfect Roommate</h2>
          <p className="text-gray-600 mb-6">
            Create your profile to start matching with compatible roommates based on lifestyle, budget, and preferences.
          </p>
          <button
            onClick={() => setShowCreateProfile(true)}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
          >
            Create Roommate Profile
          </button>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No More Profiles!</h2>
          <p className="text-gray-600 mb-6">
            You've seen all available roommate profiles. Check back later for new matches!
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setCurrentProfile(profiles[0]);
              }}
              className="w-full bg-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors"
            >
              Browse Again
            </button>
            <button className="w-full bg-white text-purple-600 border border-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-colors">
              View Matches ({matches.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Roommate Match</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
              {matches.length} Matches
            </button>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="absolute inset-4 md:inset-8 top-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full">
          {/* Profile Image */}
          <div className="relative h-2/5">
            <img
              src={currentProfile.photos[0]}
              alt={currentProfile.full_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-sm font-bold text-purple-600">
                {currentProfile.match_score}% Match
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
              <h2 className="text-2xl font-bold text-white">{currentProfile.full_name}, {currentProfile.age}</h2>
              <p className="text-white/90">{currentProfile.occupation}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 h-3/5 overflow-y-auto">
            {/* Bio */}
            <div className="mb-6">
              <p className="text-gray-700">{currentProfile.bio}</p>
            </div>

            {/* Verification Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {getVerificationBadges(currentProfile.verification_status).map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  ✓ {badge}
                </span>
              ))}
            </div>

            {/* Budget & Location */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-gray-900">Budget</span>
                </div>
                <p className="text-gray-700">
                  ${currentProfile.budget_min.toLocaleString()} - ${currentProfile.budget_max.toLocaleString()}/mo
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-medium text-gray-900">Move-in</span>
                </div>
                <p className="text-gray-700">
                  {new Date(currentProfile.move_in_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <MapPin className="w-5 h-5 text-purple-500 mr-2" />
                <span className="font-medium text-gray-900">Preferred Location</span>
              </div>
              <p className="text-gray-700">{currentProfile.preferred_location}</p>
            </div>

            {/* Lifestyle Scores */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Lifestyle</h3>
              <div className="space-y-3">
                {[
                  { key: 'cleanliness', label: 'Cleanliness', value: currentProfile.lifestyle.cleanliness },
                  { key: 'noise_level', label: 'Noise Level', value: currentProfile.lifestyle.noise_level },
                  { key: 'social_level', label: 'Social Level', value: currentProfile.lifestyle.social_level }
                ].map(({ key, label, value }) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="text-gray-900">{value}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {currentProfile.lifestyle.interests.map((interest) => {
                  const Icon = getLifestyleIcon(interest);
                  return (
                    <div
                      key={interest}
                      className="flex items-center px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {interest}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Work Schedule</span>
                <p className="font-medium text-gray-900 capitalize">{currentProfile.lifestyle.work_schedule}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Drinking</span>
                <p className="font-medium text-gray-900 capitalize">{currentProfile.lifestyle.drinking}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Smoking</span>
                <p className="font-medium text-gray-900">{currentProfile.lifestyle.smoking ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Pets</span>
                <p className="font-medium text-gray-900">
                  {currentProfile.lifestyle.pets.length > 0 ? currentProfile.lifestyle.pets.join(', ') : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </button>
        <button className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
          <MessageCircle className="w-8 h-8 text-blue-500" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-sm font-medium text-gray-700">
          {currentIndex + 1} / {profiles.length}
        </span>
      </div>
    </div>
  );
};

export default SmartRoommateMatch;