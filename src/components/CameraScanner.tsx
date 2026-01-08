import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, SwitchCamera, Flashlight, FlashlightOff, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface VideoInputDevice {
  deviceId: string;
  label: string;
}

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  active?: boolean;
}

export function CameraScanner({ onScan, onClose, active = true }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<VideoInputDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Initialize the barcode reader
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    readerRef.current = new BrowserMultiFormatReader(hints);

    // Get available cameras using navigator.mediaDevices
    navigator.mediaDevices.enumerateDevices()
      .then((devices: MediaDeviceInfo[]) => {
        const videoDevices = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }));
        setCameras(videoDevices);
        // Prefer back camera on mobile
        const backCamera = videoDevices.find((d: VideoInputDevice) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.deviceId || videoDevices[0]?.deviceId || '');
      })
      .catch((err: Error) => {
        console.error('Error listing cameras:', err);
        setError('Could not access cameras. Please grant camera permissions.');
      });

    return () => {
      readerRef.current?.reset();
    };
  }, []);

  // Start/stop scanning based on active prop and selected camera
  useEffect(() => {
    if (!active || !selectedCamera || !videoRef.current || !readerRef.current) {
      return;
    }

    setScanning(true);
    setError(null);

    const startScanning = async () => {
      try {
        await readerRef.current!.decodeFromVideoDevice(
          selectedCamera,
          videoRef.current!,
          (result) => {
            if (result) {
              const text = result.getText();
              // Debounce: don't fire same barcode twice in 2 seconds
              if (text !== lastScanned) {
                setLastScanned(text);
                onScan(text);
                // Vibrate on successful scan (if supported)
                if (navigator.vibrate) {
                  navigator.vibrate(100);
                }
                // Reset after 2 seconds to allow re-scanning same item
                setTimeout(() => setLastScanned(null), 2000);
              }
            }
            // Ignore decoding errors (they happen constantly when no barcode in view)
          }
        );

        // Check torch support
        const stream = videoRef.current?.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          setTorchSupported(!!capabilities?.torch);
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Could not start camera. Please check permissions.');
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      readerRef.current?.reset();
      setScanning(false);
    };
  }, [active, selectedCamera, onScan, lastScanned]);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!videoRef.current) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];

    if (track) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as any]
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.error('Error toggling torch:', err);
      }
    }
  }, [torchOn]);

  // Switch camera
  const switchCamera = useCallback(() => {
    const currentIndex = cameras.findIndex(c => c.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex]?.deviceId || '');
    setTorchOn(false); // Reset torch when switching cameras
  }, [cameras, selectedCamera]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Camera size={20} className="text-blue-400" />
          <span className="font-mono text-slate-200 text-sm">Camera Scanner</span>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera size={20} />
            </button>
          )}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2 transition-colors ${torchOn ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
              title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              {torchOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="font-mono text-red-400 mb-2">Camera Error</p>
            <p className="font-mono text-slate-500 text-sm">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Darkened corners */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Clear scanning area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-48">
                {/* Clear the center */}
                <div className="absolute inset-0 bg-black/0 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />

                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500" />

                {/* Scanning line animation */}
                {scanning && (
                  <div className="absolute left-2 right-2 h-0.5 bg-blue-500/80 animate-scan-line" />
                )}
              </div>
            </div>

            {/* Last scanned indicator */}
            {lastScanned && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500/20 border border-emerald-500/50 rounded-sm px-4 py-2 backdrop-blur-sm">
                <span className="font-mono text-emerald-400 text-sm">
                  Scanned: {lastScanned}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-slate-950/80 backdrop-blur-sm border-t border-slate-800 text-center">
        <p className="font-mono text-slate-500 text-xs">
          Position barcode within the frame
        </p>
        {cameras.length > 0 && (
          <p className="font-mono text-slate-600 text-xs mt-1">
            Using: {cameras.find(c => c.deviceId === selectedCamera)?.label || 'Camera'}
          </p>
        )}
      </div>
    </div>
  );
}
