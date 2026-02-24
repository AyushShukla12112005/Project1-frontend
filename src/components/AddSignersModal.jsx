import { useState } from 'react';
import { documents } from '../services/api';

export default function AddSignersModal({ doc, onClose, onSuccess }) {
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [saving, setSaving] = useState(false);

  const addSigner = () => {
    setSigners([...signers, { name: '', email: '' }]);
  };

  const updateSigner = (index, field, value) => {
    const updated = [...signers];
    updated[index][field] = value;
    setSigners(updated);
  };

  const removeSigner = (index) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await documents.addSigners(doc._id, signers);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to add signers');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Signers - {doc.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {signers.map((signer, index) => (
            <div key={index} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Signer name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={signer.name}
                  onChange={(e) => updateSigner(index, 'name', e.target.value)}
                />
                <input
                  type="email"
                  required
                  placeholder="Signer email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={signer.email}
                  onChange={(e) => updateSigner(index, 'email', e.target.value)}
                />
              </div>
              {signers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSigner(index)}
                  className="text-red-600 hover:text-red-800 mt-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSigner}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            + Add Another Signer
          </button>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Sending...' : 'Send for Signature'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
