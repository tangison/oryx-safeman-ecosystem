'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * HTML5 canvas signature pad — pointer events cover mouse, touch and pen.
 * Exposes the PNG data URL of the current signature (empty string when blank).
 */
export default function SignaturePad({
  onChange,
  label = 'Assessor signature',
}: {
  onChange: (dataUrl: string) => void;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c1917';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvas(canvas);

    let observer: ResizeObserver | null = null;
    const onResize = () => {
      // Preserve existing strokes as an image, then redraw after resize.
      const snapshot = dirty.current ? canvas.toDataURL('image/png') : null;
      initCanvas(canvas);
      if (snapshot) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = snapshot;
      }
    };
    observer = new ResizeObserver(onResize);
    observer.observe(canvas);
    return () => observer?.disconnect();
  }, [initCanvas]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!dirty.current) {
      dirty.current = true;
      setHasInk(true);
    }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && dirty.current) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    dirty.current = false;
    setHasInk(false);
    onChange('');
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor="signature-pad" className="text-sm font-medium text-stone-700">
          {label}
        </label>
        <button
          type="button"
          onClick={clear}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200/70 hover:text-stone-800"
        >
          Clear
        </button>
      </div>
      <canvas
        id="signature-pad"
        ref={canvasRef}
        className="signature-canvas h-40 w-full cursor-crosshair rounded-xl border border-dashed border-stone-400 bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        aria-label={`${label} — draw with mouse, pen or finger`}
        role="img"
      />
      <p className="mt-1 text-xs text-stone-500">
        {hasInk ? 'Signature captured.' : 'Draw your signature above with a mouse, pen or finger.'}
      </p>
    </div>
  );
}
