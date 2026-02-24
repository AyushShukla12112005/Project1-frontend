import { useRef, useEffect, useState } from 'react';

export default function SignatureCanvas({ onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

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

  const startDrawing = (e) => {
    if (!context) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const clear = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const save = () => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL('image/png');
    if (onSave) onSave(dataURL);
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
  );
}
