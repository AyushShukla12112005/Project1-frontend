import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setContext(ctx);

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (!context) return;
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setPosition(coords);
    context.beginPath();
    context.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    context.lineTo(coords.x, coords.y);
    context.stroke();
    setPosition(coords);
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const clear = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (onClear) onClear();
  };

  const save = () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    if (onSave) onSave(dataURL, position);
  };

  const isEmpty = () => {
    if (!canvasRef.current || !context) return true;
    const pixelBuffer = new Uint32Array(
      context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
  };

  // Expose methods to parent
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.clear = clear;
      canvasRef.current.save = save;
      canvasRef.current.isEmpty = isEmpty;
      canvasRef.current.toDataURL = () => canvasRef.current.toDataURL('image/png');
    }
  }, [context]);

  return (
    <div className="signature-pad-container">
      <canvas
        ref={canvasRef}
        className="w-full h-48 border-2 border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
