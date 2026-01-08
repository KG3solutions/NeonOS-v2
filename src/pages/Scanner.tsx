import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Barcode, Plus, Minus, Package, ArrowRight, AlertCircle,
  CheckCircle, RotateCcw, X, MapPin, Camera
} from 'lucide-react';
import { Button, CameraScanner } from '../components';
import { useInventory } from '../state';
import { InventoryItem } from '../types';

interface ScannerProps {
  onNavigate: (path: string) => void;
}

type ScannerReason = 'add' | 'remove' | 'pull' | 'return';
type ScannerStep = 'scan' | 'quantity' | 'reason';

export function Scanner({ onNavigate }: ScannerProps) {
  const { items, findByBarcode, adjustQuantity } = useInventory();

  const [scanInput, setScanInput] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [reason, setReason] = useState<ScannerReason | null>(null);
  const [step, setStep] = useState<ScannerStep>('scan');
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [lastAction, setLastAction] = useState<{ itemId: string; delta: number; reason: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the scan input on mount and after actions
  useEffect(() => {
    inputRef.current?.focus();
  }, [scannedItem]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const processBarcode = (barcode: string) => {
    const foundItem = findByBarcode(barcode);

    if (foundItem) {
      setScannedItem(foundItem);
      setQuantity(1);
      setReason(null);
      setStep('quantity');
      setFeedback(null);
      setCameraActive(false); // Close camera on successful scan
    } else {
      setFeedback({ type: 'error', message: `Item not found: ${barcode}` });
      setScannedItem(null);
    }
  };

  const handleScan = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      processBarcode(scanInput.trim());
      setScanInput('');
    }
  };

  const handleCameraScan = (barcode: string) => {
    processBarcode(barcode);
  };

  const handleAction = () => {
    if (!scannedItem || !reason) return;

    const delta = reason === 'add' || reason === 'return' ? quantity : -quantity;
    const actionReason = reason === 'add' ? 'purchase'
      : reason === 'remove' ? 'rental'
      : reason === 'return' ? 'return'
      : 'pull';

    // Check for negative inventory on remove
    if (delta < 0 && scannedItem.quantity + delta < 0) {
      setFeedback({
        type: 'error',
        message: `Cannot remove ${quantity} - only ${scannedItem.quantity} in stock`
      });
      return;
    }

    adjustQuantity(scannedItem.id, delta, actionReason);
    setLastAction({ itemId: scannedItem.id, delta, reason: actionReason });

    const actionVerb = delta > 0 ? 'Added' : 'Removed';
    setFeedback({
      type: 'success',
      message: `${actionVerb} ${Math.abs(delta)} ${scannedItem.name}`
    });

    // Reset for next scan
    setScannedItem(null);
    setQuantity(1);
    setReason(null);
    setStep('scan');
    inputRef.current?.focus();
  };

  const handleUndo = () => {
    if (!lastAction) return;

    // Reverse the last action
    adjustQuantity(lastAction.itemId, -lastAction.delta, 'audit_correction');

    const item = items[lastAction.itemId];
    setFeedback({
      type: 'info',
      message: `Undid last action on ${item?.name || 'item'}`
    });
    setLastAction(null);
  };

  const handleClear = () => {
    setScannedItem(null);
    setQuantity(1);
    setReason(null);
    setStep('scan');
    setScanInput('');
    inputRef.current?.focus();
  };

  const handleQuantityConfirm = () => {
    setStep('reason');
  };

  const handleReasonSelect = (selectedReason: ScannerReason) => {
    setReason(selectedReason);
  };

  const reasonConfig = {
    add: { label: 'Add to Inventory', color: 'emerald', icon: Plus },
    remove: { label: 'Remove from Inventory', color: 'red', icon: Minus },
    pull: { label: 'Pull for Rental', color: 'amber', icon: Package },
    return: { label: 'Return from Rental', color: 'blue', icon: RotateCcw },
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Camera Scanner Overlay */}
      {cameraActive && (
        <CameraScanner
          active={cameraActive}
          onScan={handleCameraScan}
          onClose={() => setCameraActive(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Barcode size={24} className="text-blue-500" />
          <h1 className="text-xl font-mono text-slate-200">Scanner Mode</h1>
        </div>
        <Button variant="ghost" icon={X} onClick={() => onNavigate('/inventory')}>
          Exit
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-b border-slate-800">
        <div className={`flex items-center gap-2 ${step === 'scan' ? 'text-emerald-400' : scannedItem ? 'text-emerald-400/50' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border ${step === 'scan' ? 'border-emerald-500 bg-emerald-500/20' : scannedItem ? 'border-emerald-500/50' : 'border-slate-700'}`}>1</div>
          <span className="font-mono text-sm">Scan</span>
        </div>
        <div className="w-8 h-px bg-slate-700" />
        <div className={`flex items-center gap-2 ${step === 'quantity' ? 'text-emerald-400' : step === 'reason' ? 'text-emerald-400/50' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border ${step === 'quantity' ? 'border-emerald-500 bg-emerald-500/20' : step === 'reason' ? 'border-emerald-500/50' : 'border-slate-700'}`}>2</div>
          <span className="font-mono text-sm">Quantity</span>
        </div>
        <div className="w-8 h-px bg-slate-700" />
        <div className={`flex items-center gap-2 ${step === 'reason' ? 'text-emerald-400' : 'text-slate-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border ${step === 'reason' ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'}`}>3</div>
          <span className="font-mono text-sm">Reason</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Feedback Banner */}
        {feedback && (
          <div className={`
            fixed top-32 left-1/2 -translate-x-1/2
            flex items-center gap-3 px-6 py-3 rounded-lg font-mono
            shadow-lg z-50
            ${feedback.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : feedback.type === 'error'
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
            }
          `}>
            {feedback.type === 'success' ? (
              <CheckCircle size={20} />
            ) : feedback.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <RotateCcw size={20} />
            )}
            {feedback.message}
          </div>
        )}

        {/* Step 1: Scan */}
        {step === 'scan' && (
          <>
            <div className="w-full max-w-2xl mb-8">
              <div className="relative">
                <Barcode size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="Scan barcode or enter SKU..."
                  className="
                    w-full
                    bg-slate-800/50
                    border-2 border-slate-700
                    rounded-xl
                    pl-14 pr-6 py-6
                    font-mono text-2xl text-slate-200
                    placeholder:text-slate-600
                    focus:outline-none focus:border-blue-500/50
                    focus:ring-4 focus:ring-blue-500/20
                    transition-all
                  "
                  autoFocus
                />
              </div>
              <p className="text-center text-slate-500 text-sm font-mono mt-3">
                Press Enter after scanning
              </p>
            </div>

            {/* Camera Scan Button */}
            <button
              onClick={() => setCameraActive(true)}
              className="
                flex flex-col items-center gap-3 p-6
                bg-slate-800/50 hover:bg-slate-800
                border-2 border-slate-700 hover:border-blue-500/50
                rounded-xl
                transition-all
                group
              "
            >
              <div className="w-16 h-16 rounded-xl bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Camera size={32} className="text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-mono text-slate-200">Use Camera</p>
                <p className="text-sm font-mono text-slate-500">Scan with device camera</p>
              </div>
            </button>

            <div className="text-center text-slate-500 font-mono mt-8">
              <p className="text-sm">Or use a hardware scanner</p>
            </div>
          </>
        )}

        {/* Step 2: Quantity */}
        {step === 'quantity' && scannedItem && (
          <div className="w-full max-w-2xl space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-mono text-slate-200 mb-1">
                    {scannedItem.name}
                  </h2>
                  <div className="flex items-center gap-4 text-slate-500 font-mono text-sm">
                    <span>{scannedItem.sku}</span>
                    {scannedItem.binCode && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        Bin {scannedItem.binCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono text-emerald-400">
                    {scannedItem.quantity}
                  </div>
                  <div className="text-slate-500 text-sm font-mono">
                    in stock
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-4 py-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-14 h-14 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-2xl font-mono transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 h-14 text-center bg-slate-700 border-none rounded-lg font-mono text-2xl text-emerald-400"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-14 h-14 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-2xl font-mono transition-colors"
                >
                  +
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <button
                  onClick={handleQuantityConfirm}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-mono font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-all"
                >
                  <ArrowRight size={20} />
                  Next: Select Reason
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reason */}
        {step === 'reason' && scannedItem && (
          <div className="w-full max-w-2xl space-y-6">
            {/* Item Summary */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="font-mono text-slate-200">{scannedItem.name}</div>
                <div className="text-sm font-mono text-slate-500">{scannedItem.sku}</div>
              </div>
              <div className="text-2xl font-mono text-emerald-400">x{quantity}</div>
            </div>

            {/* Reason Selection */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-mono text-slate-400 mb-4 text-center">Select Reason</h3>

              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(reasonConfig) as ScannerReason[]).map((r) => {
                  const config = reasonConfig[r];
                  const Icon = config.icon;
                  const isSelected = reason === r;
                  const colorClasses = {
                    emerald: isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400',
                    red: isSelected ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400',
                    amber: isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-600 text-slate-400 hover:border-amber-500/50 hover:text-amber-400',
                    blue: isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-slate-600 text-slate-400 hover:border-blue-500/50 hover:text-blue-400',
                  };

                  return (
                    <button
                      key={r}
                      onClick={() => handleReasonSelect(r)}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg font-mono text-sm
                        border-2 transition-all
                        ${colorClasses[config.color as keyof typeof colorClasses]}
                      `}
                    >
                      <Icon size={20} />
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              {reason && (
                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="text-center text-slate-500 font-mono text-sm mb-2">Preview</div>
                  <div className="text-center font-mono">
                    <span className={reason === 'add' || reason === 'return' ? 'text-emerald-400' : 'text-red-400'}>
                      {reason === 'add' || reason === 'return' ? '+' : '-'}{quantity}
                    </span>
                    <span className="text-slate-400"> → </span>
                    <span className="text-slate-200">
                      {scannedItem.quantity + (reason === 'add' || reason === 'return' ? quantity : -quantity)} units
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep('quantity')}
                  className="flex-1"
                >
                  Back
                </Button>
                <button
                  onClick={handleAction}
                  disabled={!reason}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    px-6 py-3 rounded-lg font-mono font-medium
                    transition-all
                    ${!reason
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : reason === 'add' || reason === 'return'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
                        : 'bg-red-500 hover:bg-red-400 text-white'
                    }
                  `}
                >
                  <CheckCircle size={20} />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Undo */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
        <div className="text-slate-500 font-mono text-sm">
          Step: <span className="text-slate-300 capitalize">{step}</span>
          {scannedItem && <span className="text-slate-600"> | {scannedItem.name}</span>}
        </div>
        {lastAction && (
          <Button
            variant="ghost"
            icon={RotateCcw}
            onClick={handleUndo}
          >
            Undo Last Action
          </Button>
        )}
      </div>
    </div>
  );
}
