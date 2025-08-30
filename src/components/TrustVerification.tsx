import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, Upload, User, 
  CreditCard, FileText, Building, Phone, Mail, 
  AlertTriangle, Star, Award, Loader, Camera
} from 'lucide-react';

interface VerificationStatus {
  identity: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    documents: string[];
    verified_at?: string;
    expires_at?: string;
  };
  income: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    documents: string[];
    verified_amount?: number;
    verified_at?: string;
  };
  employment: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    employer_name?: string;
    position?: string;
    verified_at?: string;
  };
  background_check: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    score?: number;
    completed_at?: string;
  };
  credit_check: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    score?: number;
    completed_at?: string;
  };
  social_verification: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    platforms: string[];
    verified_at?: string;
  };
  references: {
    status: 'pending' | 'verified' | 'rejected' | 'not_started';
    landlord_references: number;
    personal_references: number;
    verified_count: number;
  };
}

interface TenantHistory {
  landlord_name: string;
  property_address: string;
  lease_start: string;
  lease_end: string;
  rating: number;
  review: string;
  verified: boolean;
}

const TrustVerification: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [tenantHistory, setTenantHistory] = useState<TenantHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history' | 'social'>('overview');
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const loadVerificationData = async () => {
    setLoading(true);
    try {
      // Mock verification data
      const mockVerification: VerificationStatus = {
        identity: {
          status: 'verified',
          documents: ['drivers_license', 'passport'],
          verified_at: '2024-01-10T10:00:00Z',
          expires_at: '2025-01-10T10:00:00Z'
        },
        income: {
          status: 'verified',
          documents: ['pay_stub', 'tax_return'],
          verified_amount: 75000,
          verified_at: '2024-01-12T14:30:00Z'
        },
        employment: {
          status: 'verified',
          employer_name: 'Tech Corp Inc.',
          position: 'Software Engineer',
          verified_at: '2024-01-12T15:00:00Z'
        },
        background_check: {
          status: 'verified',
          score: 92,
          completed_at: '2024-01-11T09:00:00Z'
        },
        credit_check: {
          status: 'verified',
          score: 745,
          completed_at: '2024-01-11T09:30:00Z'
        },
        social_verification: {
          status: 'verified',
          platforms: ['linkedin', 'facebook'],
          verified_at: '2024-01-13T11:00:00Z'
        },
        references: {
          status: 'verified',
          landlord_references: 2,
          personal_references: 3,
          verified_count: 4
        }
      };

      const mockHistory: TenantHistory[] = [
        {
          landlord_name: 'John Smith',
          property_address: '123 Pine St, Seattle, WA',
          lease_start: '2022-06-01',
          lease_end: '2023-05-31',
          rating: 5,
          review: 'Excellent tenant. Always paid rent on time, kept the property in great condition, and was very communicative.',
          verified: true
        },
        {
          landlord_name: 'Maria Garcia',
          property_address: '456 Oak Ave, Seattle, WA',
          lease_start: '2021-08-01',
          lease_end: '2022-05-31',
          rating: 4,
          review: 'Good tenant overall. Responsible and respectful. Would rent to again.',
          verified: true
        }
      ];

      setVerificationStatus(mockVerification);
      setTenantHistory(mockHistory);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async (type: keyof VerificationStatus) => {
    // In a real app, this would initiate the verification process
    console.log(`Starting ${type} verification`);
  };

  const uploadDocument = async (type: string, file: File) => {
    setUploadingDocument(type);
    try {
      // In a real app, this would upload the document to a secure service
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Uploaded ${type} document:`, file.name);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDocument(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTrustScore = () => {
    if (!verificationStatus) return 0;
    
    const verifications = Object.values(verificationStatus);
    const verifiedCount = verifications.filter(v => v.status === 'verified').length;
    return Math.round((verifiedCount / verifications.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!verificationStatus) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Error</h3>
          <p className="text-gray-600">Unable to load verification status</p>
        </div>
      </div>
    );
  }

  const trustScore = calculateTrustScore();

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Shield className="w-8 h-8 mr-3" />
                <h1 className="text-2xl font-bold">Trust & Verification</h1>
              </div>
              <p className="text-green-100">Build trust with verified credentials and tenant history</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">{trustScore}</div>
              <div className="text-sm text-green-100">Trust Score</div>
              <div className="flex items-center mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(trustScore / 20) ? 'text-yellow-300 fill-current' : 'text-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 mb-6 shadow-sm">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'history', label: 'Tenant History', icon: Building },
              { id: 'social', label: 'Social Verification', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === id
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

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Verification Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  key: 'identity',
                  title: 'Identity Verification',
                  description: 'Government-issued ID verification',
                  icon: User,
                  status: verificationStatus.identity.status,
                  details: verificationStatus.identity.verified_at ? 
                    `Verified ${new Date(verificationStatus.identity.verified_at).toLocaleDateString()}` : 
                    'Upload government ID'
                },
                {
                  key: 'income',
                  title: 'Income Verification',
                  description: 'Proof of income and employment',
                  icon: CreditCard,
                  status: verificationStatus.income.status,
                  details: verificationStatus.income.verified_amount ? 
                    `$${verificationStatus.income.verified_amount.toLocaleString()}/year` : 
                    'Upload income documents'
                },
                {
                  key: 'background_check',
                  title: 'Background Check',
                  description: 'Criminal background screening',
                  icon: Shield,
                  status: verificationStatus.background_check.status,
                  details: verificationStatus.background_check.score ? 
                    `Score: ${verificationStatus.background_check.score}/100` : 
                    'Run background check'
                },
                {
                  key: 'credit_check',
                  title: 'Credit Check',
                  description: 'Credit score and history',
                  icon: Award,
                  status: verificationStatus.credit_check.status,
                  details: verificationStatus.credit_check.score ? 
                    `Score: ${verificationStatus.credit_check.score}` : 
                    'Check credit score'
                },
                {
                  key: 'employment',
                  title: 'Employment Verification',
                  description: 'Current employment status',
                  icon: Building,
                  status: verificationStatus.employment.status,
                  details: verificationStatus.employment.employer_name || 'Verify employment'
                },
                {
                  key: 'references',
                  title: 'References',
                  description: 'Landlord and personal references',
                  icon: Phone,
                  status: verificationStatus.references.status,
                  details: `${verificationStatus.references.verified_count}/${verificationStatus.references.landlord_references + verificationStatus.references.personal_references} verified`
                }
              ].map(({ key, title, description, icon: Icon, status, details }) => (
                <div key={key} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    {getStatusIcon(status)}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {status === 'not_started' && (
                      <button
                        onClick={() => startVerification(key as keyof VerificationStatus)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Start
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{details}</p>
                </div>
              ))}
            </div>

            {/* Trust Score Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Score Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Identity Verified', weight: 20, completed: verificationStatus.identity.status === 'verified' },
                  { label: 'Income Verified', weight: 20, completed: verificationStatus.income.status === 'verified' },
                  { label: 'Background Check', weight: 15, completed: verificationStatus.background_check.status === 'verified' },
                  { label: 'Credit Check', weight: 15, completed: verificationStatus.credit_check.status === 'verified' },
                  { label: 'Employment Verified', weight: 15, completed: verificationStatus.employment.status === 'verified' },
                  { label: 'References Verified', weight: 15, completed: verificationStatus.references.status === 'verified' }
                ].map(({ label, weight, completed }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3" />
                      )}
                      <span className="text-gray-900">{label}</span>
                    </div>
                    <span className="text-sm text-gray-600">+{weight} points</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Document Upload */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Upload</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { type: 'identity', title: 'Government ID', description: 'Driver\'s license, passport, or state ID' },
                  { type: 'income', title: 'Income Proof', description: 'Pay stubs, tax returns, or employment letter' },
                  { type: 'employment', title: 'Employment Letter', description: 'Letter from employer confirming employment' },
                  { type: 'bank', title: 'Bank Statements', description: 'Recent bank statements (last 3 months)' }
                ].map(({ type, title, description }) => (
                  <div key={type} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadDocument(type, file);
                        }}
                        className="hidden"
                      />
                      <span className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                        {uploadingDocument === type ? (
                          <span className="flex items-center">
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          'Upload Document'
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Your Security is Our Priority</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All documents are encrypted and stored securely</li>
                    <li>• We never share your personal information without consent</li>
                    <li>• Documents are automatically deleted after verification</li>
                    <li>• Our platform is SOC 2 Type II certified</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Tenant History */}
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Rental History</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {tenantHistory.map((history, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-gray-900">{history.property_address}</h4>
                          {history.verified && (
                            <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          Landlord: {history.landlord_name}
                        </p>
                        <p className="text-gray-600 text-sm mb-3">
                          {new Date(history.lease_start).toLocaleDateString()} - {new Date(history.lease_end).toLocaleDateString()}
                        </p>
                        <div className="flex items-center mb-3">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < history.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({history.rating}/5)</span>
                        </div>
                        <p className="text-gray-700 text-sm">{history.review}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Reference */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Reference</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Previous Landlord</option>
                      <option>Current Landlord</option>
                      <option>Personal Reference</option>
                      <option>Professional Reference</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Reference's full name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="reference@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Send Reference Request
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* Social Media Verification */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Verification</h3>
              <p className="text-gray-600 mb-6">
                Connect your social media accounts to build additional trust and verify your identity.
              </p>
              <div className="space-y-4">
                {[
                  { platform: 'LinkedIn', icon: '💼', connected: true, description: 'Professional network verification' },
                  { platform: 'Facebook', icon: '📘', connected: true, description: 'Social network verification' },
                  { platform: 'Instagram', icon: '📷', connected: false, description: 'Photo-based social verification' },
                  { platform: 'Twitter', icon: '🐦', connected: false, description: 'Public social media presence' }
                ].map(({ platform, icon, connected, description }) => (
                  <div key={platform} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{platform}</h4>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {connected ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      ) : (
                        <button className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                {[
                  { setting: 'Show social media profiles to landlords', enabled: true },
                  { setting: 'Allow landlords to view employment history', enabled: true },
                  { setting: 'Share verification status publicly', enabled: false },
                  { setting: 'Include in tenant directory', enabled: false }
                ].map(({ setting, enabled }) => (
                  <div key={setting} className="flex items-center justify-between">
                    <span className="text-gray-900">{setting}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustVerification;