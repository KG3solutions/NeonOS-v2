import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Box,
  Cpu,
  Zap,
  Lightbulb,
  Grid,
  Eye,
  Save,
  RotateCcw,
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button } from '../components';
import {
  Enclosure,
  ControllerBoard,
  PowerSupply,
  PlateType,
  LEDOutputType,
} from '../types';

// Real KG3 product data for builder options
const enclosures: Enclosure[] = [
  {
    id: 'enc-apache-1800',
    sku: 'ENC-APACHE-1800',
    name: 'Apache 1800 Weatherproof Case',
    price: 35,
    leftPlateOptions: ['blank', '2gang-decora'],
    rightPlateOptions: ['blank', '2gang-decora'],
    description: 'IP67 compact case, 9.5" x 7" x 4" interior - ideal for WLED builds',
  },
  {
    id: 'enc-apache-2800',
    sku: 'ENC-APACHE-2800',
    name: 'Apache 2800 Weatherproof Case',
    price: 45,
    leftPlateOptions: ['blank', '4d-1t1', '2gang-decora'],
    rightPlateOptions: ['blank', '2d-1t1', '2gang-decora'],
    description: 'IP67 standard case, 11.5" x 9.5" x 4.75" - fits PixLite/LeDMX builds',
  },
];

const controllerBoards: ControllerBoard[] = [
  {
    id: 'ctrl-a4s-mk3',
    sku: 'CTRL-A4S-MK3',
    name: 'Advatek PixLite A4-S Mk3',
    outputs: 4,
    protocol: 'SPI',
    price: 285,
    requiresEthernet: true,
    powerRequirement: '5-24V',
  },
  {
    id: 'ctrl-ledmx2max',
    sku: 'CTRL-LEDMX2MAX',
    name: 'DMXking LeDMX2 MAX',
    outputs: 2,
    protocol: 'DMX',
    price: 195,
    requiresEthernet: true,
    powerRequirement: '5-12V',
  },
  {
    id: 'ctrl-wled-4',
    sku: 'CTRL-WLED-4',
    name: 'WLED 4-Output Controller',
    outputs: 4,
    protocol: 'SPI',
    price: 145,
    requiresEthernet: false,
    powerRequirement: '5V',
  },
];

const powerSupplies: PowerSupply[] = [
  {
    id: 'psu-mw-5v10a',
    sku: 'PSU-MW-5V10A',
    name: 'Meanwell 5V 10A PSU',
    voltage: 5,
    amperage: 10,
    price: 32,
  },
  {
    id: 'psu-mw-12v5a',
    sku: 'PSU-MW-12V5A',
    name: 'Meanwell 12V 5A PSU',
    voltage: 12,
    amperage: 5,
    price: 28,
  },
  {
    id: 'psu-mw-24v13a',
    sku: 'PSU-MW-24V13A',
    name: 'Meanwell 24V 13.3A PSU',
    voltage: 24,
    amperage: 13.3,
    price: 48,
  },
];

// Simple LED output type display data
const ledOutputTypeOptions: { id: LEDOutputType; name: string; description: string }[] = [
  { id: 'rgb', name: 'RGB', description: 'Standard 3-color LED strips' },
  { id: 'rgbw', name: 'RGBW', description: '4-color with dedicated white' },
  { id: 'rgbcct', name: 'RGBCCT', description: '5-color with warm/cool white' },
  { id: 'single', name: 'Single Color', description: 'Single channel output' },
];

const plateTypes: (PlateType & { price: number })[] = [
  { id: 'blank', name: 'Blank Plate', slots: 0, compatibleConnectors: [], price: 5 },
  { id: '4d-1t1', name: '4x D-Series / 1x TRUE1 (Left)', slots: 5, compatibleConnectors: ['speakon', 'true1'], price: 14 },
  { id: '2d-1t1', name: '2x D-Series / 1x TRUE1 (Right)', slots: 3, compatibleConnectors: ['speakon', 'true1'], price: 10 },
  { id: '2gang-decora', name: '2-Gang Decora Plate', slots: 2, compatibleConnectors: ['xlr', 'rj45'], price: 8 },
];

type BuilderStep = 'enclosure' | 'controller' | 'psu' | 'led-type' | 'plates' | 'preview';

const steps: { id: BuilderStep; label: string; icon: React.ElementType }[] = [
  { id: 'enclosure', label: 'Enclosure', icon: Box },
  { id: 'controller', label: 'Controller', icon: Cpu },
  { id: 'psu', label: 'Power Supply', icon: Zap },
  { id: 'led-type', label: 'LED Type', icon: Lightbulb },
  { id: 'plates', label: 'Plates', icon: Grid },
  { id: 'preview', label: 'Preview', icon: Eye },
];

// Simplified config for the builder UI
type BuilderConfig = {
  enclosure?: Enclosure;
  controller?: ControllerBoard;
  powerSupply?: PowerSupply;
  ledOutputType?: LEDOutputType;
  leftPlateId?: string;
  rightPlateId?: string;
};

export function Builder() {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('enclosure');
  const [config, setConfig] = useState<BuilderConfig>({});

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'enclosure': return !!config.enclosure;
      case 'controller': return !!config.controller;
      case 'psu': return !!config.powerSupply;
      case 'led-type': return !!config.ledOutputType;
      case 'plates': return !!config.leftPlateId && !!config.rightPlateId;
      case 'preview': return true;
      default: return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const resetBuilder = () => {
    setConfig({});
    setCurrentStep('enclosure');
  };

  const calculateTotal = () => {
    let total = 0;
    if (config.enclosure) {
      total += config.enclosure.price;
    }
    if (config.controller) {
      total += config.controller.price;
    }
    if (config.powerSupply) {
      total += config.powerSupply.price;
    }
    if (config.leftPlateId) {
      const plate = plateTypes.find(p => p.id === config.leftPlateId);
      if (plate) total += plate.price;
    }
    if (config.rightPlateId) {
      const plate = plateTypes.find(p => p.id === config.rightPlateId);
      if (plate) total += plate.price;
    }
    return total;
  };

  const selectedLEDTypeOption = ledOutputTypeOptions.find(l => l.id === config.ledOutputType);

  return (
    <PageTemplate
      title="Controller Builder"
      actions={
        <Button variant="ghost" icon={RotateCcw} onClick={resetBuilder}>
          Start Over
        </Button>
      }
    >
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                disabled={index > currentStepIndex}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all
                  ${isActive
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                    : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Icon size={16} />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight size={20} className="text-slate-600 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            {/* Step 1: Enclosure */}
            {currentStep === 'enclosure' && (
              <div className="space-y-4">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Select Enclosure</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enclosures.map(enc => (
                    <button
                      key={enc.id}
                      onClick={() => setConfig(prev => ({ ...prev, enclosure: enc }))}
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${config.enclosure?.id === enc.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-slate-200">{enc.name}</div>
                          <div className="text-xs font-mono text-slate-500">{enc.sku}</div>
                        </div>
                        <div className="text-emerald-400 font-mono">${enc.price}</div>
                      </div>
                      {enc.description && (
                        <p className="text-sm text-slate-500 mt-2">{enc.description}</p>
                      )}
                      <div className="mt-3 text-xs font-mono text-slate-600">
                        Plates: {enc.leftPlateOptions.join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Controller */}
            {currentStep === 'controller' && (
              <div className="space-y-4">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Select Controller Board</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {controllerBoards.map(ctrl => (
                    <button
                      key={ctrl.id}
                      onClick={() => setConfig(prev => ({ ...prev, controller: ctrl }))}
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${config.controller?.id === ctrl.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-slate-200">{ctrl.name}</div>
                          <div className="text-xs font-mono text-slate-500">{ctrl.sku}</div>
                        </div>
                        <div className="text-emerald-400 font-mono">${ctrl.price}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
                          {ctrl.outputs} outputs
                        </span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-mono rounded">
                          {ctrl.protocol}
                        </span>
                        {ctrl.requiresEthernet && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">
                            Ethernet
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Power Supply */}
            {currentStep === 'psu' && (
              <div className="space-y-4">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Select Power Supply</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {powerSupplies.map(psu => (
                    <button
                      key={psu.id}
                      onClick={() => setConfig(prev => ({ ...prev, powerSupply: psu }))}
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${config.powerSupply?.id === psu.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-slate-200">{psu.name}</div>
                          <div className="text-xs font-mono text-slate-500">{psu.sku}</div>
                        </div>
                        <div className="text-emerald-400 font-mono">${psu.price}</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">
                          {psu.voltage}V
                        </span>
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
                          {psu.amperage}A
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded">
                          {psu.voltage * psu.amperage}W
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: LED Output Type */}
            {currentStep === 'led-type' && (
              <div className="space-y-4">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Select LED Output Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ledOutputTypeOptions.map(led => (
                    <button
                      key={led.id}
                      onClick={() => setConfig(prev => ({ ...prev, ledOutputType: led.id }))}
                      className={`
                        p-4 rounded-lg border text-left transition-all
                        ${config.ledOutputType === led.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                        }
                      `}
                    >
                      <div className="font-mono text-slate-200">{led.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{led.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Plates */}
            {currentStep === 'plates' && config.enclosure && (
              <div className="space-y-6">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Select Connector Plates</h2>

                <div>
                  <h3 className="text-sm font-mono text-slate-400 mb-3">Left Side Plate</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {plateTypes
                      .filter(p => config.enclosure?.leftPlateOptions.includes(p.id))
                      .map(plate => (
                        <button
                          key={plate.id}
                          onClick={() => setConfig(prev => ({ ...prev, leftPlateId: plate.id }))}
                          className={`
                            p-3 rounded-lg border text-left transition-all
                            ${config.leftPlateId === plate.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                            }
                          `}
                        >
                          <div className="font-mono text-slate-200 text-sm">{plate.name}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-slate-500">{plate.slots} slots</span>
                            <span className="text-xs text-emerald-400">${plate.price}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-mono text-slate-400 mb-3">Right Side Plate</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {plateTypes
                      .filter(p => config.enclosure?.rightPlateOptions.includes(p.id))
                      .map(plate => (
                        <button
                          key={plate.id}
                          onClick={() => setConfig(prev => ({ ...prev, rightPlateId: plate.id }))}
                          className={`
                            p-3 rounded-lg border text-left transition-all
                            ${config.rightPlateId === plate.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                            }
                          `}
                        >
                          <div className="font-mono text-slate-200 text-sm">{plate.name}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-slate-500">{plate.slots} slots</span>
                            <span className="text-xs text-emerald-400">${plate.price}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Preview */}
            {currentStep === 'preview' && (
              <div className="space-y-6">
                <h2 className="text-lg font-mono text-emerald-400 mb-4">Build Preview</h2>

                <div className="space-y-4">
                  {config.enclosure && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">Enclosure</div>
                        <div className="font-mono text-slate-200">{config.enclosure.name}</div>
                      </div>
                      <div className="text-emerald-400 font-mono">${config.enclosure.price}</div>
                    </div>
                  )}

                  {config.controller && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">Controller</div>
                        <div className="font-mono text-slate-200">{config.controller.name}</div>
                      </div>
                      <div className="text-emerald-400 font-mono">${config.controller.price}</div>
                    </div>
                  )}

                  {config.powerSupply && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">Power Supply</div>
                        <div className="font-mono text-slate-200">{config.powerSupply.name}</div>
                      </div>
                      <div className="text-emerald-400 font-mono">${config.powerSupply.price}</div>
                    </div>
                  )}

                  {selectedLEDTypeOption && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">LED Type</div>
                        <div className="font-mono text-slate-200">{selectedLEDTypeOption.name}</div>
                      </div>
                      <div className="text-slate-500 font-mono">—</div>
                    </div>
                  )}

                  {config.leftPlateId && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">Left Plate</div>
                        <div className="font-mono text-slate-200">
                          {plateTypes.find(p => p.id === config.leftPlateId)?.name}
                        </div>
                      </div>
                      <div className="text-emerald-400 font-mono">
                        ${plateTypes.find(p => p.id === config.leftPlateId)?.price}
                      </div>
                    </div>
                  )}

                  {config.rightPlateId && (
                    <div className="flex justify-between items-center p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <div className="text-xs text-slate-500 font-mono uppercase">Right Plate</div>
                        <div className="font-mono text-slate-200">
                          {plateTypes.find(p => p.id === config.rightPlateId)?.name}
                        </div>
                      </div>
                      <div className="text-emerald-400 font-mono">
                        ${plateTypes.find(p => p.id === config.rightPlateId)?.price}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-mono text-slate-400">Total</span>
                    <span className="text-2xl font-mono text-emerald-400">${calculateTotal()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="primary" icon={Save} className="flex-1">
                    Save as Recipe
                  </Button>
                  <Button variant="ghost" icon={Cpu} className="flex-1">
                    Create Build Job
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
              <Button
                variant="ghost"
                icon={ChevronLeft}
                onClick={prevStep}
                disabled={currentStepIndex === 0}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={!canProceed() || currentStepIndex === steps.length - 1}
              >
                {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
                {currentStepIndex < steps.length - 1 && <ChevronRight size={16} className="ml-1" />}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar - Current Selection Summary */}
        <div>
          <Card title="Build Summary">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className={`p-2 rounded border ${config.enclosure ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700'}`}>
                  <div className="text-xs text-slate-500 font-mono uppercase">Enclosure</div>
                  <div className="font-mono text-sm text-slate-300">
                    {config.enclosure?.name || '—'}
                  </div>
                </div>

                <div className={`p-2 rounded border ${config.controller ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700'}`}>
                  <div className="text-xs text-slate-500 font-mono uppercase">Controller</div>
                  <div className="font-mono text-sm text-slate-300">
                    {config.controller?.name || '—'}
                  </div>
                </div>

                <div className={`p-2 rounded border ${config.powerSupply ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700'}`}>
                  <div className="text-xs text-slate-500 font-mono uppercase">Power Supply</div>
                  <div className="font-mono text-sm text-slate-300">
                    {config.powerSupply?.name || '—'}
                  </div>
                </div>

                <div className={`p-2 rounded border ${config.ledOutputType ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700'}`}>
                  <div className="text-xs text-slate-500 font-mono uppercase">LED Type</div>
                  <div className="font-mono text-sm text-slate-300">
                    {selectedLEDTypeOption?.name || '—'}
                  </div>
                </div>

                <div className={`p-2 rounded border ${config.leftPlateId && config.rightPlateId ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700'}`}>
                  <div className="text-xs text-slate-500 font-mono uppercase">Plates</div>
                  <div className="font-mono text-sm text-slate-300">
                    {config.leftPlateId && config.rightPlateId
                      ? `${plateTypes.find(p => p.id === config.leftPlateId)?.name} / ${plateTypes.find(p => p.id === config.rightPlateId)?.name}`
                      : '—'
                    }
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-500">Estimated Total</span>
                  <span className="text-lg font-mono text-emerald-400">${calculateTotal()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
