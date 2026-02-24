import { useRef, useEffect, useState } from 'react';

export default function ModernSignatureCreator({ onSave, onCancel, mode = 'signature', fieldLabel = 'Signature' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState('draw');
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('Allura');
  const [selectedColor, setSelectedColor] = useState('#1a1a1a');
  const [lineWidth, setLineWidth] = useState(3);

  const fonts = [
    { name: 'Allura', display: 'Allura' },
    { name: 'Great Vibes', display: 'Great Vibes' },
    { name: 'Satisfy', display: 'Satisfy' },
    { name: 'Pacifico', display: 'Pacifico' },
    { name: 'Caveat', display: 'Caveat' },
    { name: 'Dancing Script', display: 'Dancing Script' }
  ];

  const colors = [
    { hex: '#1a1a1a', name: 'Black' },
    { hex: '#1e40af', name: 'Blue' },
    { hex: '#dc2626', name: 'Red' },
    { hex: '#059669', name: 'Green' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = selectedColor;
  }, [selectedColor, lineWidth]);

  const startDrawing = (e) => {
    if (signatureType !== 'draw') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.beginPath();
    
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || signatureType !== 'draw') return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const generateTextSignature = () => {
    if (!textInput.trim()) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    clearCanvas();
    // Set transparent background
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `${mode === 'initials' ? '70' : '55'}px "${selectedFont}", cursive`;
    ctx.fillStyle = selectedColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textInput, canvas.width / 2, canvas.height / 2);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        clearCanvas();
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.7;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      alert('Error: Canvas not initialized');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if canvas is empty
    let isEmpty = true;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) { // Check alpha channel
        isEmpty = false;
        break;
      }
    }
    
    if (isEmpty) {
      alert('Please draw or type your signature first');
      return;
    }
    
    // Create a new canvas to trim whitespace and ensure transparency
    const trimmedCanvas = document.createElement('canvas');
    const trimCtx = trimmedCanvas.getContext('2d');
    
    // Find bounds of non-transparent pixels
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Add padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    trimmedCanvas.width = width;
    trimmedCanvas.height = height;
    
    // Draw trimmed signature
    trimCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
    
    const signatureData = trimmedCanvas.toDataURL('image/png');
    console.log('Signature saved with transparent background');
    onSave(signatureData);
  };

  useEffect(() => {
    if (signatureType === 'type' && textInput) {
      generateTextSignature();
    }
  }, [textInput, selectedFont, selectedColor, signatureType]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {fieldLabel}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'signature' ? 'Create your digital signature' : 'Add your initials'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Choose Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSignatureType('draw')}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  signatureType === 'draw'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">✏️</div>
                <div className="font-medium text-sm">Draw</div>
                {signatureType === 'draw' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setSignatureType('type')}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  signatureType === 'type'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">⌨️</div>
                <div className="font-medium text-sm">Type</div>
                {signatureType === 'type' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setSignatureType('upload')}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  signatureType === 'upload'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">📤</div>
                <div className="font-medium text-sm">Upload</div>
                {signatureType === 'upload' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Type Input */}
          {signatureType === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {mode === 'signature' ? 'Full Name' : 'Initials'}
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={mode === 'signature' ? 'John Doe' : 'JD'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Font Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {fonts.map(font => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`p-3 rounded-lg border-2 transition text-xl ${
                        selectedFont === font.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ fontFamily: `"${font.name}", cursive` }}
                    >
                      {textInput || font.display}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Input */}
          {signatureType === 'upload' && (
            <div>
              <label className="block w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all">
                  <div className="text-5xl mb-3">📁</div>
                  <p className="text-base font-medium text-gray-700">Click to upload image</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, or GIF (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Customization Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Color Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Color</label>
              <div className="flex gap-3">
                {colors.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedColor === color.hex 
                        ? 'border-blue-500 scale-110 shadow-lg' 
                        : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor === color.hex && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Width (for draw mode) */}
            {signatureType === 'draw' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pen Size: {lineWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
          </div>

          {/* Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Preview</label>
              {signatureType === 'draw' && (
                <button
                  onClick={clearCanvas}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-inner" style={{ background: 'repeating-linear-gradient(45deg, #f9fafb, #f9fafb 10px, #f3f4f6 10px, #f3f4f6 20px)' }}>
              <canvas
                ref={canvasRef}
                width={750}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair bg-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              Apply {fieldLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
