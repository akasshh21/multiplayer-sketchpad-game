import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const DrawingCanvas = forwardRef(({ isDrawer, onDraw, onClear }, ref) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    const colors = ['#000000', '#e23636', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ffffff'];
    const sizes = [2, 5, 10, 15];

    useEffect(() => {
        const canvas = canvasRef.current;
        if(canvas){
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      drawRemoteStroke(stroke){
        const canvas = canvasRef.current;
        if(!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(stroke.x0, stroke.y0);
        ctx.lineTo(stroke.x1, stroke.y1);
        ctx.stroke();
      },
      clearCanvas(){
        const canvas = canvasRef.current;
        if(!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }));

    const getMousePos = (e) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return{
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      if(!isDrawer) return;
      setIsDrawing(true);
      const pos = getMousePos(e);
      setLastPos(pos);
    };

    const draw = (e) => {
      if(!isDrawing || !isDrawer) return;
      
      const pos = getMousePos(e);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      onDraw({
        x0: lastPos.x,
        y0: lastPos.y,
        x1: pos.x,
        y1: pos.y,
        color: currentColor,
        size: brushSize
      });
      
      setLastPos(pos);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    const clearCanvas = () => {
      if(!isDrawer) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      onClear();
    };

    return (
      <div className="bg-gray-900 rounded-lg p-4 border-2 border-red-600">
        {isDrawer && (
          <div className="mb-3 flex gap-4 items-center flex-wrap">
            <div className="flex gap-2">
              <span className="text-white font-bold mr-2">Colors:</span>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrentColor(c)}
                  className={`w-10 h-10 rounded-full border-4 transition ${
                    currentColor === c ? 'border-yellow-400 scale-110' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-white font-bold mr-2">Size:</span>
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`w-12 h-12 rounded flex items-center justify-center transition ${
                    brushSize === s ? 'bg-yellow-600 scale-110' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={`${s}px`}
                >
                  <div
                    className="rounded-full bg-white"
                    style={{ width: s * 2, height: s * 2 }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={clearCanvas}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold transition ml-auto"
            >
              Clear
            </button>
          </div>
        )}
        
        {!isDrawer && (
          <div className="mb-3 text-center text-yellow-400 font-bold">
            Spectator mode
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`border-4 border-gray-700 rounded bg-white w-full ${
            isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'
          }`}
          style={{ maxHeight: '600px', touchAction: 'none' }}
        />
      </div>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;