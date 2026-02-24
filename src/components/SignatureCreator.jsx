import { useRef, useEffect, useState } from 'react';

export default function SignatureCreator({ onSave, onCancel, mode = 'signature' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState('draw');
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('Brush Script MT');
  const [selectedColor, setSelectedColor] = useState('#000000');

  const fonts = [
    { name: 'Brush Script MT', style: 'cursive' },
    { name: 'Dancing Script', style: 'cursive' },
    { name: 'Pacifico', style: 'cursive' },
    { name: 'Great Vibes', style: 'cursive' },
    { name: 'Courier New', style: 'monospace' }
  ];

  const colors = [
    { hex: '#000000', name: 'Black' },
    { hex: '#0066CC', name: 'Blue' },
    { hex: '#CC0000', name: 'Red' },
    { hex: '#009900', name: 'Green' },
    { hex: '#663399', name: 'Purple' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = selectedColor;
  }, [selectedColor]);

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
    ctx.font = `60px "${selectedFont}", ${fonts.find(f => f.name === selectedFont)?.style || 'cursive'}`;
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
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
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
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  useEffect(() => {
    if (signatureType === 'type' && textInput) {
      generateTextSignature();
    }
  }, [textInput, selectedFont, selectedColor, signatureType]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-3xl">
          <h2 className="text-3xl font-bold text-white">
            {mode === 'signature' ? '✍️ Create Your Signature' : '📝 Create Your Initials'}
          </h2>
          <p className="text-indigo-100 mt-2">Choose your preferred signing method</p>
        </div>

        <div className="p-8">
          {/* Signature Type Tabs */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              onClick={() => setSignatureType('draw')}
              className={`py-4 px-6 rounded-xl font-semibold transition-all transform ${
                signatureType === 'draw'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="text-2xl mb-1">✏️</div>
              <div>Draw</div>
            </button>
            <button
              onClick={() => setSignatureType('type')}
              className={`py-4 px-6 rounded-xl font-semibold transition-all transform ${
                signatureType === 'type'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="text-2xl mb-1">⌨️</div>
              <div>Type</div>
            </button>
            <button
              onClick={() => setSignatureType('upload')}
              className={`py-4 px-6 rounded-xl font-semibold transition-all transform ${
                signatureType === 'upload'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="text-2xl mb-1">📤</div>
              <div>Upload</div>
            </button>
          </div>

          {/* Type Input */}
          {signatureType === 'type' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {mode === 'signature' ? 'Full Name' : 'Initials'}
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={mode === 'signature' ? 'John Doe' : 'JD'}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-xl"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Font Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {fonts.map(font => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`p-4 rounded-xl border-2 transition text-2xl ${
                        selectedFont === font.name
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ fontFamily: `"${font.name}", ${font.style}` }}
                    >
                      {textInput || 'Signature'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Input */}
          {signatureType === 'upload' && (
            <div className="mb-6">
              <label className="block w-full">
                <div className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-lg font-semibold text-gray-700">Click to upload signature image</p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, or GIF up to 5MB</p>
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

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Signature Color</label>
            <div className="flex gap-4">
              {colors.map(color => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`relative w-14 h-14 rounded-full border-4 transition-all transform ${
                    selectedColor === color.hex 
                      ? 'border-indigo-600 scale-110 shadow-lg' 
                      : 'border-gray-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.hex && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xl">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Preview</label>
            <div className="border-3 border-gray-300 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={800}
                height={250}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair bg-white"
              />
            </div>
            {signatureType === 'draw' && (
              <button
                onClick={clearCanvas}
                className="mt-3 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition"
              >
                🗑️ Clear Canvas
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 px-6 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-semibold transition-all transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-xl transition-all transform hover:scale-105"
            >
              ✓ Save {mode === 'signature' ? 'Signature' : 'Initials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
