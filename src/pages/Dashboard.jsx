import { useState, useEffect } from 'react';
import { documents } from '../services/api';
import UploadModal from '../components/UploadModal';
import AddSignersModal from '../components/AddSignersModal';

export default function Dashboard({ setToken }) {
  const [docs, setDocs] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data } = await documents.getAll();
      setDocs(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-800',
      pending: 'bg-yellow-200 text-yellow-800',
      signed: 'bg-blue-200 text-blue-800',
      completed: 'bg-green-200 text-green-800'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">DocuSign Clone</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Upload Document
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {docs.map((doc) => (
                <tr key={doc._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {doc.status === 'draft' && (
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add Signers
                      </button>
                    )}
                    {(doc.status === 'pending' || doc.status === 'signed') && doc.signers && doc.signers.length > 0 && (
                      <div className="space-y-1">
                        {doc.signers.map((signer, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={`text-xs ${signer.signed ? 'text-green-600' : 'text-orange-600'}`}>
                              {signer.signed ? '✓' : '⏳'} {signer.name}
                            </span>
                            {!signer.signed && (
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/sign/${signer.token}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Signing link copied to clipboard!');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Copy Link
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={loadDocuments} />}
      {selectedDoc && <AddSignersModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} onSuccess={loadDocuments} />}
    </div>
  );
}
