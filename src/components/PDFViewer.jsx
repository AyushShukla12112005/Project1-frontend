import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path - using local worker from node_modules
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PDFViewer({ 
  pdfFile, 
  currentPage = 1,
  onPageChange,
  children,
  onCanvasReady 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale] = useState(1.5);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isRendering, setIsRendering] = useState(false);

  // Load PDF document
  useEffect(() => {
    if (!pdfFile) {
      console.log('No PDF file provided');
      return;
    }

    const loadPDF = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedArray = new Uint8Array(e.target.result);
            const loadingTask = pdfjsLib.getDocument(typedArray);
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
            if (onPageChange) {
              onPageChange(pdf.numPages);
            }
          } catch (err) {
            console.error('Error loading PDF document:', err);
            alert('Failed to load PDF: ' + err.message);
          }
        };
        fileReader.onerror = (err) => {
          console.error('FileReader error:', err);
          alert('Failed to read PDF file');
        };
        fileReader.readAsArrayBuffer(pdfFile);
      } catch (error) {
        console.error('Error in loadPDF:', error);
        alert('Failed to load PDF: ' + error.message);
      }
    };

    loadPDF();
  }, [pdfFile]);

  // Render current page with optimization
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) {
      return;
    }

    let isCancelled = false;
    let isCurrentlyRendering = false;

    const renderPage = async () => {
      if (isCurrentlyRendering) return;
      
      try {
        isCurrentlyRendering = true;
        setIsRendering(true);
        
        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas || isCancelled) {
          setIsRendering(false);
          isCurrentlyRendering = false;
          return;
        }
        
        const context = canvas.getContext('2d', { alpha: false });
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        setCanvasSize({ width: viewport.width, height: viewport.height });
        
        if (onCanvasReady && !isCancelled) {
          onCanvasReady({ width: viewport.width, height: viewport.height });
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: true
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        
        if (!isCancelled) {
          renderTaskRef.current = null;
          setIsRendering(false);
          isCurrentlyRendering = false;
        }
      } catch (error) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', error);
        }
        setIsRendering(false);
        isCurrentlyRendering = false;
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, scale, onCanvasReady]);

  return (
    <div 
      ref={containerRef}
      className="relative bg-gray-100 overflow-auto"
      style={{ height: '700px', width: '100%' }}
    >
      {!pdfDoc && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}
      {pdfDoc && (
        <div className="relative inline-block">
          <canvas 
            ref={canvasRef}
            className="block"
            style={{ maxWidth: '100%' }}
          />
          {/* Overlay container for signatures - positioned relative to canvas */}
          <div 
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: `${canvasSize.width}px`, 
              height: `${canvasSize.height}px` 
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
