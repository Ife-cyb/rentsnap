import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, CheckCircle, Clock, Send, User, 
  CreditCard, Building, Phone, Mail, Calendar, 
  DollarSign, Users, Loader, AlertCircle, Download
} from 'lucide-react';

interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  required_documents: string[];
  estimated_time: number;
  auto_fill_fields: string[];
}

interface SavedApplication {
  id: string;
  property_title: string;
  landlord_name: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  documents_submitted: string[];
  application_fee: number;
}

interface ApplicationData {
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    ssn_last_four: string;
  };
  employment: {
    employer_name: string;
    position: string;
    annual_income: number;
    employment_length: string;
    supervisor_contact: string;
  };
  rental_history: {
    current_address: string;
    landlord_name: string;
    landlord_contact: string;
    rent_amount: number;
    lease_start: string;
    lease_end: string;
  };
  references: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  }[];
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  additional_info: {
    pets: boolean;
    pet_details: string;
    smoking: boolean;
    move_in_date: string;
    lease_term: number;
  };
}

const QuickApply: React.FC = () => {
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [savedApplications, setSavedApplications] = useState<SavedApplication[]>([]);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ApplicationTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: File }>({});

  useEffect(() => {
    loadApplicationData();
  }, []);

  const loadApplicationData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockTemplates: ApplicationTemplate[] = [
        {
          id: '1',
          name: 'Standard Rental Application',
          description: 'Complete application with all standard requirements',
          required_documents: ['id', 'income_proof', 'bank_statements', 'references'],
          estimated_time: 15,
          auto_fill_fields: ['personal_info', 'employment', 'rental_history']
        },
        {
          id: '2',
          name: 'Quick Application',
          description: 'Streamlined application for pre-qualified tenants',
          required_documents: ['id', 'income_proof'],
          estimated_time: 5,
          auto_fill_fields: ['personal_info', 'employment']
        },
        {
          id: '3',
          name: 'Student Application',
          description: 'Specialized application for students with guarantor options',
          required_documents: ['id', 'enrollment_proof', 'guarantor_info'],
          estimated_time: 10,
          auto_fill_fields: ['personal_info']
        }
      ];

      const mockSavedApplications: SavedApplication[] = [
        {
          id: '1',
          property_title: 'Modern Downtown Loft',
          landlord_name: 'Sarah Chen',
          submitted_at: '2024-01-15T10:30:00Z',
          status: 'under_review',
          documents_submitted: ['id', 'income_proof', 'bank_statements'],
          application_fee: 50
        },
        {
          id: '2',
          property_title: 'Cozy University Studio',
          landlord_name: 'Mike Johnson',
          submitted_at: '2024-01-12T14:20:00Z',
          status: 'approved',
          documents_submitted: ['id', 'income_proof'],
          application_fee: 25
        }
      ];

      const mockApplicationData: ApplicationData = {
        personal_info: {
          full_name: 'Emma Wilson',
          email: 'emma@example.com',
          phone: '(555) 123-4567',
          date_of_birth: '1995-06-15',
          ssn_last_four: '1234'
        },
        employment: {
          employer_name: 'Tech Corp Inc.',
          position: 'Software Engineer',
          annual_income: 75000,
          employment_length: '2 years',
          supervisor_contact: 'supervisor@techcorp.com'
        },
        rental_history: {
          current_address: '123 Pine St, Seattle, WA 98101',
          landlord_name: 'John Smith',
          landlord_contact: '(555) 987-6543',
          rent_amount: 2200,
          lease_start: '2022-06-01',
          lease_end: '2024-05-31'
        },
        references: [
          {
            name: 'Alice Johnson',
            relationship: 'Friend',
            phone: '(555) 111-2222',
            email: 'alice@example.com'
          },
          {
            name: 'Bob Wilson',
            relationship: 'Colleague',
            phone: '(555) 333-4444',
            email: 'bob@example.com'
          }
        ],
        emergency_contact: {
          name: 'Mary Wilson',
          relationship: 'Mother',
          phone: '(555) 555-6666'
        },
        additional_info: {
          pets: false,
          pet_details: '',
          smoking: false,
          move_in_date: '2024-02-01',
          lease_term: 12
        }
      };

      setTemplates(mockTemplates);
      setSavedApplications(mockSavedApplications);
      setApplicationData(mockApplicationData);
    } catch (error) {
      console.error('Error loading application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (documentType: string, file: File) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      // In a real app, this would submit the application to the backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Application submitted successfully');
      
      // Reset form
      setSelectedTemplate(null);
      setCurrentStep(0);
      setUploadedDocuments({});
      
      // Reload applications
      await loadApplicationData();
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'under_review': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application system...</p>
        </div>
      </div>
    );
  }

  if (selectedTemplate) {
    const steps = [
      'Personal Information',
      'Employment Details',
      'Rental History',
      'References',
      'Documents',
      'Review & Submit'
    ];

    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-4">
          {/* Progress Header */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-2 mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-1 ${
                      index < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </p>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {currentStep === 0 && applicationData && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={applicationData.personal_info.full_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={applicationData.personal_info.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue={applicationData.personal_info.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      defaultValue={applicationData.personal_info.date_of_birth}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedTemplate.required_documents.map((docType) => {
                    const documentNames: { [key: string]: string } = {
                      id: 'Government ID',
                      income_proof: 'Proof of Income',
                      bank_statements: 'Bank Statements',
                      references: 'References',
                      enrollment_proof: 'Enrollment Verification',
                      guarantor_info: 'Guarantor Information'
                    };

                    const isUploaded = uploadedDocuments[docType];

                    return (
                      <div key={docType} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="mb-4">
                          {isUploaded ? (
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                          ) : (
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {documentNames[docType] || docType}
                        </h4>
                        {isUploaded ? (
                          <div>
                            <p className="text-sm text-green-600 mb-2">✓ {isUploaded.name}</p>
                            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                              Replace
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(docType, file);
                              }}
                              className="hidden"
                            />
                            <span className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                              Upload File
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
                
                {/* Application Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Application Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Template:</span>
                      <span className="ml-2 font-medium">{selectedTemplate.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Documents:</span>
                      <span className="ml-2 font-medium">
                        {Object.keys(uploadedDocuments).length}/{selectedTemplate.required_documents.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-3" required />
                    <span className="text-sm text-gray-700">
                      I agree to the terms and conditions and authorize the landlord to verify the information provided in this application.
                    </span>
                  </label>
                </div>

                <button
                  onClick={submitApplication}
                  disabled={submitting || Object.keys(uploadedDocuments).length < selectedTemplate.required_documents.length}
                  className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Quick Apply</h1>
          </div>
          <p className="text-blue-100">
            Apply to multiple properties with one universal application
          </p>
        </div>

        {/* Application Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Application Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>~{template.estimated_time} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>{template.required_documents.length} documents required</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                  Start Application
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Applications */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {savedApplications.map((application) => (
              <div key={application.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{application.property_title}</h3>
                    <p className="text-gray-600 text-sm mb-2">Landlord: {application.landlord_name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</span>
                      <span>Fee: ${application.application_fee}</span>
                      <span>Documents: {application.documents_submitted.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {getStatusIcon(application.status)}
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ').charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickApply;