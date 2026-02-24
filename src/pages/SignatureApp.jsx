import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernSignatureCreator from '../components/ModernSignatureCreator';
import { documents } from '../services/api';

export default function SignatureApp({ token, setToken }) {
  const navigate = useNavigate();
  const pdfContainerRef = useRef(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeModal, setActiveModal] = useState(null);
  const [myDocuments, setMyDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSignatureLocked, setIsSignatureLocked] = useState(false);
  const [placedSignatures, setPlacedSignatures] = useState([]);
  const [nextSignatureId, setNextSignatureId] = useState(1);
  
  // Field states
  const [fields, setFields] = useState({
    signature: null,
    comments: '',
    date: new Date().toLocaleDateString()
  });

  useEffect(() => {
    if (token) {
      loadMyDocuments();
    }
  }, [token]);

  const loadMyDocuments = async () => {
    try {
      const { data } = await documents.getAll();
      setMyDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setCurrentPage(1);
      setTotalPages(1);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleSaveDocument = async () => {
    if (!pdfFile) {
      alert('Please upload a PDF file first');
      return;
    }

    setIsSaving(true);

    try {
      // Collect all signatures
      const allSignatures = [...placedSignatures];
      if (fields.signature && isSignatureLocked) {
        allSignatures.push({
          id: nextSignatureId,
          data: fields.signature,
          position: signaturePosition
        });
      }

      console.log('📄 Starting PDF download...');
      console.log('Signatures to embed:', allSignatures.length);

      // If no signatures, download original PDF directly
      if (allSignatures.length === 0) {
        const url = URL.createObjectURL(pdfFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFile.name;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('✓ PDF downloaded successfully!');
        setIsSaving(false);
        return;
      }

      // Prepare upload data
      const formData = new FormData();
      formData.append('document', pdfFile);
      formData.append('title', pdfFile.name);
      formData.append('signatures', JSON.stringify(allSignatures));
      formData.append('comments', fields.comments || '');
      formData.append('signerName', 'User');
      formData.append('signerEmail', 'user@example.com');

      console.log('📤 Uploading to server...');

      // Upload to backend
      const uploadResponse = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const savedDocument = await uploadResponse.json();
      console.log('✓ Upload successful:', savedDocument._id);

      // Download the processed PDF
      console.log('📥 Downloading processed PDF...');
      const downloadResponse = await fetch(`http://localhost:5000/api/documents/${savedDocument._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token') || ''}`
        }
      });

      if (!downloadResponse.ok) {
        throw new Error('Download failed');
      }

      const blob = await downloadResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = savedDocument.title || 'signed-document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      console.log('✓ Download complete!');
      alert('✓ PDF with signatures downloaded successfully!');

      // Refresh documents list
      if (token) {
        loadMyDocuments();
      }

    } catch (error) {
      console.error('❌ Download error:', error);
      alert('Failed to download PDF: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && !isSignatureLocked) {
      // Get the transform div (PDF container) by ID
      const transformDiv = document.getElementById('pdf-transform-container');
      if (!transformDiv) return;
      
      const rect = transformDiv.getBoundingClientRect();
      
      // Calculate position relative to the PDF (transform div)
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Apply inverse scale to get actual position on PDF
      const scale = zoomLevel / 100;
      const newX = (mouseX / scale) - dragOffset.x;
      const newY = (mouseY / scale) - dragOffset.y;
      
      // Constrain within PDF bounds (800x1100)
      const maxX = 800 - 250;
      const maxY = 1100 - 150;
      
      const constrainedX = Math.max(0, Math.min(maxX, newX));
      const constrainedY = Math.max(0, Math.min(maxY, newY));
      
      setSignaturePosition({ x: constrainedX, y: constrainedY });
    } else if (isDraggingFromSidebar) {
      // Get the transform div for drag preview
      const transformDiv = document.getElementById('pdf-transform-container');
      if (!transformDiv) return;
      
      const rect = transformDiv.getBoundingClientRect();
      const scale = zoomLevel / 100;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = Math.max(0, Math.min(800 - 200, (mouseX / scale) - 100));
      const newY = Math.max(0, Math.min(1100 - 100, (mouseY / scale) - 30));
      setDragPreviewPosition({ x: newX, y: newY });
    }
  }, [isDragging, isSignatureLocked, dragOffset, isDraggingFromSidebar, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (isDraggingFromSidebar && dragPreviewPosition) {
      setSignaturePosition(dragPreviewPosition);
      setIsDraggingFromSidebar(false);
      setDragPreviewPosition(null);
    }
  }, [isDraggingFromSidebar, dragPreviewPosition]);

  const handleSidebarDragStart = (e) => {
    if (!fields.signature) return;
    setIsDraggingFromSidebar(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'signature');
    // Create a drag image
    const dragImage = e.target.querySelector('img');
    if (dragImage) {
      e.dataTransfer.setDragImage(dragImage, 50, 25);
    }
  };

  const handleSidebarDragEnd = () => {
    setIsDraggingFromSidebar(false);
    setDragPreviewPosition(null);
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fields.signature) return;
    
    // Get the transform div (PDF container) by ID
    const transformDiv = document.getElementById('pdf-transform-container');
    if (!transformDiv) return;
    
    const rect = transformDiv.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    // Calculate position relative to PDF
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newX = Math.max(0, Math.min(800 - 200, (mouseX / scale) - 100));
    const newY = Math.max(0, Math.min(1100 - 100, (mouseY / scale) - 30));
    
    setSignaturePosition({ x: newX, y: newY });
    setIsDraggingFromSidebar(false);
    setDragPreviewPosition(null);
    
    console.log('Signature dropped at position:', { x: newX, y: newY });
    console.log('PDF dimensions: 800x1100px');
    
    // Automatically lock signature after drop (ready to be embedded in PDF)
    setIsSignatureLocked(true);
    console.log('Signature automatically locked to PDF page');
  };

  const handleMergeSignature = () => {
    if (!fields.signature || !isSignatureLocked) {
      alert('Please drop a signature on the PDF first');
      return;
    }
    
    // Add current signature to placed signatures list
    const newSignature = {
      id: nextSignatureId,
      data: fields.signature,
      position: { ...signaturePosition }
    };
    
    setPlacedSignatures([...placedSignatures, newSignature]);
    setNextSignatureId(nextSignatureId + 1);
    
    // Reset signature field to allow adding another
    setFields({ ...fields, signature: null });
    setSignaturePosition({ x: 50, y: 50 });
    setIsSignatureLocked(false);
    
    alert('✓ Signature merged! You can add another signature or save the document.');
  };

  const handlePdfDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDraggingFromSidebar) {
      e.dataTransfer.dropEffect = 'move';
      // Update preview position
      const transformDiv = document.getElementById('pdf-transform-container');
      if (!transformDiv) return;
      
      const rect = transformDiv.getBoundingClientRect();
      const scale = zoomLevel / 100;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = Math.max(0, Math.min(800 - 200, (mouseX / scale) - 100));
      const newY = Math.max(0, Math.min(1100 - 100, (mouseY / scale) - 30));
      setDragPreviewPosition({ x: newX, y: newY });
    }
  };

  const handleSignatureMouseDown = (e) => {
    // Only allow dragging if signature is not locked
    if (isSignatureLocked) {
      return; // User must click the tick button to unlock
    }
    
    if (!fields.signature) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Get the transform div (PDF container) by ID
    const transformDiv = document.getElementById('pdf-transform-container');
    if (!transformDiv) return;
    
    const rect = transformDiv.getBoundingClientRect();
    const scale = zoomLevel / 100;
    
    // Mouse position relative to PDF
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate offset from mouse to signature position (accounting for scale)
    setDragOffset({
      x: (mouseX / scale) - signaturePosition.x,
      y: (mouseY / scale) - signaturePosition.y
    });
  };

  const handleDeleteSignature = () => {
    if (window.confirm('Are you sure you want to delete this signature?')) {
      setFields({ ...fields, signature: null });
      setSignaturePosition({ x: 50, y: 50 });
      setIsSignatureLocked(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Signature App</h1>
              <p className="text-xs text-gray-500">Add signatures to PDFs</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {token && (
            <>
              <button
                onClick={() => setShowDocuments(!showDocuments)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                My Documents ({myDocuments.length})
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </>
          )}
          {!token && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Center - PDF Upload/Preview with external vertical scrollbar */}
        <div className="flex-1 bg-gray-300 overflow-y-auto overflow-x-hidden p-6">
          <div className="flex items-center justify-center min-h-full">
          {!pdfUrl ? (
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Document</h2>
                  <p className="text-gray-600">Add your signature and save</p>
                </div>

                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-base font-medium text-gray-700">Click to upload PDF</p>
                    <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">PDF files only (max 500MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>

                {!token && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> Login to save your signed documents
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col max-w-7xl mx-auto">
              <div className="bg-white shadow-2xl rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                {/* Helpful instruction banner */}
                {fields.signature && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      {isSignatureLocked 
                        ? "✓ Signature locked to PDF page - Click 'Save & Download' to embed permanently" 
                        : "💡 Drag signature from sidebar, then click ✓ to lock it to the PDF page"}
                    </span>
                  </div>
                )}
                
                {/* PDF Preview with Controls */}
                <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
                  {/* PDF Controls Toolbar */}
                  <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      {/* Zoom Controls */}
                      <button
                        onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                        className="p-2 hover:bg-gray-100 rounded transition"
                        title="Zoom Out"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium min-w-[60px] text-center">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                        className="p-2 hover:bg-gray-100 rounded transition"
                        title="Zoom In"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="px-3 py-1 text-sm hover:bg-gray-100 rounded transition"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Rotate Controls */}
                      <button
                        onClick={() => setRotation((rotation - 90 + 360) % 360)}
                        className="p-2 hover:bg-gray-100 rounded transition"
                        title="Rotate Left"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium min-w-[40px] text-center">{rotation}°</span>
                      <button
                        onClick={() => setRotation((rotation + 90) % 360)}
                        className="p-2 hover:bg-gray-100 rounded transition"
                        title="Rotate Right"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* PDF Viewer Container - NO internal scrollbar, displays full PDF at normal size */}
                  <div 
                    ref={pdfContainerRef}
                    className="flex-1 relative bg-gray-200 flex items-start justify-center py-8"
                    style={{ userSelect: 'none' }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDrop={handlePdfDrop}
                    onDragOver={handlePdfDragOver}
                  >
                    {/* Transform wrapper for zoom and rotation - this is the positioning context */}
                    <div
                      id="pdf-transform-container"
                      className="relative"
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease',
                        width: '800px',
                        height: '1100px'
                      }}
                    >
                        {/* PDF Wrapper - blocks scrollbar area */}
                        <div 
                          className="relative"
                          style={{
                            width: '800px',
                            height: '1100px',
                            position: 'relative'
                          }}
                        >
                          {/* PDF embed - no internal controls */}
                          <embed
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="shadow-2xl"
                            style={{ 
                              pointerEvents: isDragging || isDraggingFromSidebar ? 'none' : 'auto',
                              width: '820px',
                              height: '1100px',
                              display: 'block',
                              backgroundColor: 'white',
                              border: 'none',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              marginRight: '-20px'
                            }}
                          />
                          {/* Overlay to cover scrollbar area */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: '20px',
                              height: '1100px',
                              backgroundColor: 'white',
                              zIndex: 1000,
                              pointerEvents: 'none'
                            }}
                          />
                        </div>

                        {/* Placed (Merged) Signatures - Read-only overlays */}
                        {placedSignatures.map((sig) => (
                          <div
                            key={sig.id}
                            style={{
                              position: 'absolute',
                              left: `${sig.position.x}px`,
                              top: `${sig.position.y}px`,
                              zIndex: 900,
                              pointerEvents: 'none',
                              opacity: 0.7
                            }}
                          >
                            <img 
                              src={sig.data} 
                              alt={`Merged Signature ${sig.id}`} 
                              className="h-16"
                              style={{ 
                                filter: 'contrast(1.2)',
                                imageRendering: 'crisp-edges'
                              }}
                            />
                          </div>
                        ))}
                        
                        {/* Drop Zone Indicator */}
                        {isDraggingFromSidebar && (
                          <div className="absolute inset-0 border-4 border-dashed border-blue-400 bg-blue-50 bg-opacity-20 pointer-events-none flex items-center justify-center z-50">
                            <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold">
                              📍 Drop signature here
                            </div>
                          </div>
                        )}
                        
                        {/* Drag Preview from Sidebar */}
                        {isDraggingFromSidebar && dragPreviewPosition && fields.signature && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${dragPreviewPosition.x}px`,
                              top: `${dragPreviewPosition.y}px`,
                              opacity: 0.6,
                              pointerEvents: 'none',
                              zIndex: 999
                            }}
                          >
                            <img 
                              src={fields.signature} 
                              alt="Signature Preview" 
                              className="h-16"
                              style={{ 
                                filter: 'contrast(1.2)',
                                imageRendering: 'crisp-edges'
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Draggable Signature Overlay */}
                        {fields.signature && !isDraggingFromSidebar && (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${signaturePosition.x}px`,
                              top: `${signaturePosition.y}px`,
                              cursor: isSignatureLocked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
                              zIndex: 1000,
                              pointerEvents: 'auto'
                            }}
                            onMouseDown={handleSignatureMouseDown}
                            className="select-none"
                          >
                            <div className="relative group">
                          {/* Blue border box with corner handles */}
                          <div 
                            className="relative"
                            style={{
                              border: '2px solid #3b82f6',
                              borderRadius: '4px',
                              padding: '12px 20px',
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              minWidth: '200px'
                            }}
                          >
                            {/* Corner handles */}
                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                            
                            {/* Action buttons - top right */}
                            <div className="absolute -top-10 right-0 flex gap-2">
                              {/* Freeze/Lock toggle button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newLockedState = !isSignatureLocked;
                                  setIsSignatureLocked(newLockedState);
                                  
                                  if (newLockedState) {
                                    // When locking, show confirmation that signature is now fixed to PDF page
                                    console.log('Signature locked to PDF page at position:', signaturePosition);
                                  }
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className={`p-2 rounded shadow-lg transition ${
                                  isSignatureLocked 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                                } text-white`}
                                title={isSignatureLocked ? "Locked to PDF page - signature will be embedded at this position" : "Click to lock signature to PDF page"}
                              >
                                {isSignatureLocked ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </button>
                              
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSignature();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-lg"
                                title="Remove signature"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Inner red border box */}
                            <div 
                              style={{
                                border: '1px solid #ef4444',
                                borderRadius: '2px',
                                padding: '8px 16px',
                                backgroundColor: 'white'
                              }}
                            >
                              {/* Signature image */}
                              <img 
                                src={fields.signature} 
                                alt="Signature" 
                                className="select-none"
                                style={{ 
                                  filter: 'contrast(1.2)',
                                  imageRendering: 'crisp-edges',
                                  height: '60px',
                                  display: 'block'
                                }}
                                draggable={false}
                              />
                            </div>
                          </div>
                          
                          {/* Lock status indicator */}
                          {isSignatureLocked && (
                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold">Locked to PDF page</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                      </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
                  <button
                    onClick={() => {
                      setPdfFile(null);
                      setPdfUrl(null);
                      setCurrentPage(1);
                      setTotalPages(1);
                      setFields({
                        signature: null,
                        initials: null,
                        name: '',
                        email: '',
                        date: new Date().toLocaleDateString()
                      });
                      setPlacedSignatures([]);
                      setIsSignatureLocked(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove PDF
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 font-medium">
                      📄 {pdfFile?.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-700 font-semibold min-w-[80px] text-center">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right Sidebar - Signing Options */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Signing options</h2>
            <p className="text-sm text-gray-500 mt-1">Add your signature</p>
          </div>

          <div className="flex-1 p-6 space-y-6">
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
                </div>
                
                {fields.signature ? (
                  <div className="relative group">
                    <div 
                      className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 cursor-move hover:border-blue-400 hover:bg-blue-50 transition-all"
                      draggable={true}
                      onDragStart={handleSidebarDragStart}
                      onDragEnd={handleSidebarDragEnd}
                    >
                      <img src={fields.signature} alt="Signature" className="max-h-16 mx-auto pointer-events-none" />
                      <p className="text-xs text-center text-gray-500 mt-2">
                        ✋ Drag & drop onto PDF
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setActiveModal('signature')}
                        className="bg-white rounded p-1.5 shadow-md hover:bg-blue-50"
                        title="Edit signature"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDeleteSignature}
                        className="bg-white rounded p-1.5 shadow-md hover:bg-red-50"
                        title="Delete signature"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Add Signature clicked');
                      setActiveModal('signature');
                    }}
                    className="w-full py-3 px-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-600 hover:text-blue-600"
                  >
                    + Add Signature
                  </button>
                )}
              </div>
              
              {/* Merge Signature Button */}
              {isSignatureLocked && fields.signature && (
                <div className="mb-4">
                  <button
                    onClick={handleMergeSignature}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Merge Signature & Add Another
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Click to add this signature and create another one
                  </p>
                </div>
              )}
              
              {/* Placed Signatures List */}
              {placedSignatures.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Merged Signatures ({placedSignatures.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {placedSignatures.map((sig) => (
                      <div key={sig.id} className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <img src={sig.data} alt={`Signature ${sig.id}`} className="h-8" />
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('Remove this merged signature?')) {
                              setPlacedSignatures(placedSignatures.filter(s => s.id !== sig.id));
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Fields */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Optional fields</h3>
              
              {/* Recent */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Recent</label>
                </div>
                <button
                  onClick={() => setShowDocuments(true)}
                  className="w-full py-2.5 px-4 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium text-gray-700"
                >
                  📄 View Recent Documents
                </button>
              </div>

              {/* Comments */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Comments</label>
                </div>
                <textarea
                  value={fields.comments || ''}
                  onChange={(e) => setFields({ ...fields, comments: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none"
                  placeholder="Add your comments here..."
                  rows="3"
                />
              </div>

              {/* Settings */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-gray-700">Settings</label>
                </div>
                
                {token ? (
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4 space-y-3">
                    {/* Username - Read only */}
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Username</label>
                      <input
                        type="text"
                        value="User"
                        readOnly
                        className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    
                    {/* Email - Read only */}
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Email</label>
                      <input
                        type="email"
                        value="user@example.com"
                        readOnly
                        className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    
                    {/* Logout Toggle */}
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">Please login to view settings</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Button - Fixed at bottom */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleSaveDocument}
              disabled={!pdfFile || isSaving}
              className="w-full py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>
            
            {/* Status messages */}
            {isSaving && (
              <p className="text-xs text-center text-blue-600 mt-2 font-medium">
                ⏳ Merging signature with PDF...
              </p>
            )}
            {!isSaving && isSignatureLocked && fields.signature && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">Signature Locked to PDF</span>
                </div>
                <p className="text-xs text-center text-green-600 mt-1">
                  Ready to save - signature will be embedded at this position
                </p>
              </div>
            )}
            {!isSaving && !isSignatureLocked && fields.signature && (
              <p className="text-xs text-center text-gray-500 mt-2">
                ✓ Position signature on PDF, then click ✓ to lock
              </p>
            )}
            {!isSaving && !fields.signature && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Add a signature to save the document
              </p>
            )}
          </div>
        </div>
      </div>

      {/* My Documents Sidebar */}
      {showDocuments && token && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => setShowDocuments(false)}>
          <div className="bg-white w-96 h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
              <button onClick={() => setShowDocuments(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {myDocuments.map((doc) => (
                <div key={doc._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{doc.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      {doc.status === 'completed' && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          ✓ Signed
                        </span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:5000/api/documents/${doc._id}/download`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.title;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } else {
                            alert('Failed to download document');
                          }
                        } catch (err) {
                          console.error('Download error:', err);
                          alert('Failed to download document');
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {myDocuments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'signature' && (
        <>
          {console.log('Rendering signature modal')}
          <ModernSignatureCreator
            mode="signature"
            fieldLabel="Signature"
            onSave={(data) => {
              console.log('Signature saved:', data ? 'Yes' : 'No');
              setFields({ ...fields, signature: data });
              setActiveModal(null);
            }}
            onCancel={() => {
              console.log('Signature cancelled');
              setActiveModal(null);
            }}
          />
        </>
      )}

      {activeModal === 'initials' && (
        <>
          {console.log('Rendering initials modal')}
          <ModernSignatureCreator
            mode="initials"
            fieldLabel="Initials"
            onSave={(data) => {
              console.log('Initials saved:', data ? 'Yes' : 'No');
              setFields({ ...fields, initials: data });
              setActiveModal(null);
            }}
            onCancel={() => {
              console.log('Initials cancelled');
              setActiveModal(null);
            }}
          />
        </>
      )}
    </div>
  );
}
