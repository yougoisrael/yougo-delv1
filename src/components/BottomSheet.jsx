/**
 * BottomSheet.jsx — Universal Smooth Sheet
 * - Spring open animation
 * - Slide-down close animation
 * - Touch swipe to dismiss
 * - GPU accelerated (will-change + translateZ)
 */
import { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
  @keyframes bs-backdrop-in  { from{opacity:0}              to{opacity:1} }
  @keyframes bs-backdrop-out { from{opacity:1}              to{opacity:0} }
  @keyframes bs-sheet-in     { from{transform:translateX(-50%) translateY(100%) translateZ(0)} to{transform:translateX(-50%) translateY(0) translateZ(0)} }
  @keyframes bs-sheet-out    { from{transform:translateX(-50%) translateY(0) translateZ(0)}    to{transform:translateX(-50%) translateY(100%) translateZ(0)} }
`;

export default function BottomSheet({
  open,
  onClose,
  children,
  maxHeight = "92vh",
  snapPoints,        // optional: not used yet
  showHandle = true,
  backdropBlur = true,
  zIndex = 6000,
}) {
  const [visible,  setVisible]  = useState(false);
  const [closing,  setClosing]  = useState(false);
  const sheetRef   = useRef(null);
  const startY     = useRef(null);
  const startH     = useRef(0);
  const isDragging = useRef(false);
  const CLOSE_THRESH = 80; // px drag down to trigger close
  const DURATION_IN  = 340;
  const DURATION_OUT = 260;

  /* ── open/close state machine ── */
  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      triggerClose();
    }
  }, [open]);

  function triggerClose() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, DURATION_OUT);
  }

  function handleBackdropClick() {
    onClose?.();
  }

  /* ── touch drag to dismiss ── */
  const onTouchStart = useCallback(e => {
    startY.current     = e.touches[0].clientY;
    startH.current     = 0;
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const onTouchMove = useCallback(e => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return; // don't allow dragging up
    isDragging.current = true;
    startH.current = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateX(-50%) translateY(${dy}px) translateZ(0)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform  = "";
    }
    if (startH.current > CLOSE_THRESH) {
      onClose?.();
    }
    isDragging.current = false;
  }, [onClose]);

  if (!visible) return null;

  const animIn  = `bs-sheet-in ${DURATION_IN}ms cubic-bezier(0.32, 0.72, 0, 1) both`;
  const animOut = `bs-sheet-out ${DURATION_OUT}ms cubic-bezier(0.4, 0, 1, 1) both`;
  const bdIn    = `bs-backdrop-in 220ms ease both`;
  const bdOut   = `bs-backdrop-out ${DURATION_OUT}ms ease both`;

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: backdropBlur ? "blur(4px)" : "none",
          WebkitBackdropFilter: backdropBlur ? "blur(4px)" : "none",
          zIndex,
          animation: closing ? bdOut : bdIn,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", bottom: 0,
          left: "50%",
          transform: "translateX(-50%) translateZ(0)",
          width: "100vw", maxWidth: 430,
          background: "white",
          borderRadius: "26px 26px 0 0",
          zIndex: zIndex + 1,
          maxHeight,
          display: "flex", flexDirection: "column",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
          willChange: "transform",
          animation: closing ? animOut : animIn,
          overflowX: "hidden",
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div style={{
            display: "flex", justifyContent: "center",
            padding: "12px 0 6px", flexShrink: 0,
            cursor: "grab",
          }}>
            <div style={{
              width: 40, height: 4, borderRadius: 4,
              background: "#D1D5DB",
            }}/>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{
          overflowY: "auto", overflowX: "hidden",
          flex: 1,
          WebkitOverflowScrolling: "touch",
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
