import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ModernSignatureCreator from '../components/ModernSignatureCreator';
import { signatures } from '../services/api';

export default function SignDocument() {
  console.log('SignDocument component loaded!'); // Debug log
  
  const { token } = useParams();
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [signatureType, setSignatureType] = useState('simple');
  
  // Field states
  const [fields, setFields] = useState({
    signature: null,
    initials: null,
    name: '',
    date: new Date().toLocaleDateString()
  });

  useEffect(() => {
    loadDocument();
  }, [token]);

  const loadDocument = async () => {
    try {
      const { data } = await signatures.getDocument(token);
      setDocData(data);
      setFields(prev => ({ ...prev, name: data.signer.name }));
    } catch (err) {
      console.error('Load document error:', err);
      // Set mock data for testing
      setDocData({
        document: { title: 'Test Document', originalFile: 'test.pdf' },
        signer: { name: 'Test User', email: 'test@example.com' }
      });
      setFields(prev => ({ ...prev, name: 'Test User' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!fields.signature) {
      alert('Please add your signature');
      return;
    }

    try {
      await signatures.sign(token, { signatureData: fields.signature });
      setSigned(true);
    } catch (err) {
      alert('Signing failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading document...</div>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Signed!</h1>
          <p className="text-gray-600">Your signature has been successfully applied.</p>
        </div>
      </div>
    );
  }

  // Mock pages for thumbnail view
  const totalPages = 3;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
              {docData?.document.title}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Page Thumbnails */}
        <div className="w-32 bg-gray-200 border-r border-gray-300 overflow-y-auto">
          <div className="p-2 space-y-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-full aspect-[3/4] rounded border-2 transition-all ${
                  currentPage === page
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="bg-white h-full flex flex-col items-center justify-center text-xs">
                  <div className="text-4xl text-gray-300 mb-1">📄</div>
                  <div className="text-gray-500 font-medium">{page}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Document Preview */}
        <div className="flex-1 bg-gray-300 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
              {/* Document Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded">
                    <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-2xl">🏛️</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Department of Posts</h2>
                    <p className="text-sm text-red-100">Ministry of Communications</p>
                    <p className="text-sm text-red-100">Government of India</p>
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="bg-white p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Online Gramin Dak Sevak Engagement
                  </h1>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic mt-1">Candidate Application Form</p>
                
                {/* Signature Preview Badge */}
                {fields.signature && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <img src={fields.signature} alt="Signature" className="h-8" />
                    <span className="text-sm text-blue-700 font-medium">Signature added</span>
                  </div>
                )}
              </div>

              {/* Application Info Section */}
              <div className="p-6">
                <div className="bg-red-600 text-white px-4 py-2 font-bold mb-4">
                  Application Info
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Registration No:</label>
                      <p className="text-gray-900">G114901106855347</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Application No:</label>
                      <p className="text-gray-900">GDS0126-F-177019507305544453</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="border-2 border-gray-300 rounded p-2">
                      <div className="w-32 h-40 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">👤</div>
                          <p className="text-xs text-gray-500">Candidate Photo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="p-6">
                <div className="bg-red-600 text-white px-4 py-2 font-bold mb-4">
                  Personal Details
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Full Name:</label>
                    <p className="text-gray-900">{docData?.signer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Father / Guardian:</label>
                    <p className="text-gray-900">Shyam Ji Shukla</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Signing Options */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Signing options</h2>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSignatureType('simple')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    signatureType === 'simple'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">✍️</div>
                  <div className="text-xs font-semibold text-gray-700">Simple Signature</div>
                </button>
                <button
                  onClick={() => setSignatureType('digital')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    signatureType === 'digital'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-xs font-semibold text-gray-700">Digital Signature</div>
                  <div className="text-xs text-yellow-600 mt-1">😊</div>
                </button>
              </div>
            </div>

            {/* Required Fields */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Required fields</h3>
              
              {/* Signature Field */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Signature</label>
                  <button className="ml-auto text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                {fields.signature ? (
                  <div className="relative group">
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <img src={fields.signature} alt="Signature" className="max-h-16 mx-auto" />
                    </div>
                    <button
                      onClick={() => setActiveModal('signature')}
                      className="absolute top-2 right-2 bg-white rounded p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveModal('signature')}
                    className="w-full py-3 px-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-600 hover:text-blue-600"
                  >
                    + Add Signature
                  </button>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Optional fields</h3>
              
              {/* Initials */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    AC
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Initials</label>
                </div>
                
                {fields.initials ? (
                  <div className="relative group">
                    <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                      <img src={fields.initials} alt="Initials" className="max-h-12 mx-auto" />
                    </div>
                    <button
                      onClick={() => setActiveModal('initials')}
                      className="absolute top-2 right-2 bg-white rounded p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveModal('initials')}
                    className="w-full py-2.5 px-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-600"
                  >
                    + Add Initials
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    N
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Name</label>
                </div>
                <input
                  type="text"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  placeholder="Your name"
                />
              </div>
            </div>
          </div>

          {/* Sign Button - Fixed at bottom */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleSign}
              disabled={!fields.signature}
              className="w-full py-3.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Sign</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'signature' && (
        <ModernSignatureCreator
          mode="signature"
          fieldLabel="Signature"
          onSave={(data) => {
            setFields({ ...fields, signature: data });
            setActiveModal(null);
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'initials' && (
        <ModernSignatureCreator
          mode="initials"
          fieldLabel="Initials"
          onSave={(data) => {
            setFields({ ...fields, initials: data });
            setActiveModal(null);
          }}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
