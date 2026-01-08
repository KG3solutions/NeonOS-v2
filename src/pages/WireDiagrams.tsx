import { useState, useMemo } from 'react';
import { Cable, Sparkles, Library, Table, Info, Printer, Save, Pencil, X, Check, Star } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Select } from '../components';
import { Modal } from '../components/Modal';
import { WireColorGrid } from '../components/WireColorCheckbox';
import { useWireDiagrams, useAppDispatch, usePermission, useAuth } from '../state';
import { WIRE_COLORS } from '../constants';
import { PinMapping, Connector, Pin } from '../types';

export function WireDiagrams() {
  const { connectors } = useWireDiagrams();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();
  const { user } = useAuth();

  const [sourceConnectorId, setSourceConnectorId] = useState('');
  const [destConnectorId, setDestConnectorId] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [terminationMap, setTerminationMap] = useState<PinMapping[] | null>(null);
  const [selectingFor, setSelectingFor] = useState<'source' | 'destination' | null>(null);
  const [viewingConnector, setViewingConnector] = useState<Connector | null>(null);

  // Pin editing state
  const [editingPins, setEditingPins] = useState(false);
  const [editedPins, setEditedPins] = useState<Pin[]>([]);

  const startEditingPins = () => {
    if (viewingConnector) {
      setEditedPins([...viewingConnector.pins]);
      setEditingPins(true);
    }
  };

  const cancelEditingPins = () => {
    setEditingPins(false);
    setEditedPins([]);
  };

  const updatePin = (pinId: string, field: 'label' | 'function', value: string) => {
    setEditedPins(prev => prev.map(pin =>
      pin.id === pinId ? { ...pin, [field]: value || null } : pin
    ));
  };

  const savePinEdits = () => {
    if (!viewingConnector) return;

    // Dispatch connector update action
    dispatch({
      type: 'CONNECTOR_UPDATE',
      payload: {
        id: viewingConnector.id,
        changes: { pins: editedPins }
      }
    });

    // Update local viewing state
    setViewingConnector(prev => prev ? { ...prev, pins: editedPins } : null);
    setEditingPins(false);
    setEditedPins([]);
  };

  // Set as Default for connector pin configuration (Owner only)
  const [defaultSaved, setDefaultSaved] = useState(false);

  const setAsDefault = () => {
    if (!viewingConnector || user?.role !== 'owner') return;

    // Save the current pin configuration as default in localStorage
    const defaults = JSON.parse(localStorage.getItem('connectorPinDefaults') || '{}');
    defaults[viewingConnector.id] = {
      connectorId: viewingConnector.id,
      connectorName: viewingConnector.name,
      pins: viewingConnector.pins,
      savedAt: new Date().toISOString(),
      savedBy: user.name,
    };
    localStorage.setItem('connectorPinDefaults', JSON.stringify(defaults));

    setDefaultSaved(true);
    setTimeout(() => setDefaultSaved(false), 2000);
  };

  const isDefaultSaved = (connectorId: string) => {
    const defaults = JSON.parse(localStorage.getItem('connectorPinDefaults') || '{}');
    return !!defaults[connectorId];
  };

  // Print the termination map
  const handlePrint = () => {
    if (!terminationMap || !sourceConnector || !destConnector) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = terminationMap.map(pin => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;">Pin ${pin.sourcePin}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: ${pin.wireColor}; border: 1px solid #999;"></div>
            ${pin.wireColorName}
          </div>
        </td>
        <td style="padding: 8px; border: 1px solid #ccc;">${pin.wireFunction}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">Pin ${pin.destinationPin}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Wire Termination Map</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 10px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #333; color: #fff; padding: 10px; text-align: left; }
          tr:nth-child(even) { background: #f5f5f5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info { font-size: 12px; color: #666; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Wire Termination Map</h1>
            <h2>${sourceConnector.name} → ${destConnector.name}</h2>
          </div>
          <div class="info">
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Wires: ${terminationMap.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Source Pin</th>
              <th>Wire Color</th>
              <th>Function</th>
              <th>Dest Pin</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save diagram to localStorage (placeholder for actual save)
  const handleSave = () => {
    if (!terminationMap || !sourceConnector || !destConnector) return;

    const diagram = {
      id: `diagram-${Date.now()}`,
      sourceConnector: sourceConnector.id,
      destConnector: destConnector.id,
      mapping: terminationMap,
      createdAt: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem('savedDiagrams') || '[]');
    saved.push(diagram);
    localStorage.setItem('savedDiagrams', JSON.stringify(saved));
    alert('Diagram saved!');
  };

  const connectorOptions = useMemo(() => [
    { value: '', label: 'Select Connector' },
    ...Object.values(connectors).map(c => ({
      value: c.id,
      label: `${c.name} (${c.pins.length} pins)`,
    })),
  ], [connectors]);

  const sourceConnector = sourceConnectorId ? connectors[sourceConnectorId] : null;
  const destConnector = destConnectorId ? connectors[destConnectorId] : null;

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev =>
      prev.includes(colorName)
        ? prev.filter(c => c !== colorName)
        : [...prev, colorName]
    );
    setTerminationMap(null);
  };

  const canGenerate = sourceConnectorId && destConnectorId && selectedColors.length > 0;

  // Handle connector selection from library
  const handleSelectFromLibrary = (connector: Connector) => {
    if (selectingFor === 'source') {
      setSourceConnectorId(connector.id);
      setSelectingFor(null);
      setTerminationMap(null);
    } else if (selectingFor === 'destination') {
      setDestConnectorId(connector.id);
      setSelectingFor(null);
      setTerminationMap(null);
    } else {
      setViewingConnector(connector);
    }
  };

  const handleGenerate = () => {
    if (!sourceConnector || !destConnector) return;

    // Generate termination map using sequential strategy
    const mapping: PinMapping[] = [];
    const maxPins = Math.min(
      sourceConnector.pins.length,
      destConnector.pins.length,
      selectedColors.length
    );

    for (let i = 0; i < maxPins; i++) {
      const sourcePin = sourceConnector.pins[i];
      const destPin = destConnector.pins[i];
      const wireColor = WIRE_COLORS.find(c => c.name === selectedColors[i]);

      mapping.push({
        sourcePin: String(sourcePin.number),
        destinationPin: String(destPin.number),
        wireColor: wireColor?.hex || '#666',
        wireColorName: selectedColors[i],
        wireFunction: sourcePin.function || sourcePin.label,
        notes: null,
      });
    }

    setTerminationMap(mapping);
  };

  return (
    <PageTemplate title="Wire Diagram System">
      <div className="space-y-8">
        {/* Instructions */}
        <Card icon={Info}>
          <div className="text-slate-400 text-sm font-mono">
            <p className="mb-2">Create wire termination diagrams by selecting:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-500">
              <li>Source connector type</li>
              <li>Wire colors in your cable</li>
              <li>Destination connector type</li>
            </ol>
          </div>
        </Card>

        {/* Section 1: Source Connector Selection */}
        <Card title="1. Source Connector" icon={Cable}>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select
                label="Select source connector"
                value={sourceConnectorId}
                onChange={(id) => { setSourceConnectorId(id); setTerminationMap(null); }}
                options={connectorOptions}
              />
            </div>
            <Button
              variant={selectingFor === 'source' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectingFor(selectingFor === 'source' ? null : 'source')}
            >
              {selectingFor === 'source' ? 'Cancel' : 'Browse'}
            </Button>
          </div>

          {selectingFor === 'source' && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-400 text-sm font-mono">
                Click a connector from the library below to select as source
              </p>
            </div>
          )}

          {sourceConnector && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-mono text-emerald-400 text-sm mb-2">
                {sourceConnector.name}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sourceConnector.pins.map(pin => (
                  <div
                    key={pin.id}
                    className="flex items-center gap-2 text-sm font-mono"
                  >
                    <span className="text-slate-500">Pin {pin.number}:</span>
                    <span className="text-slate-300">{pin.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Wire Color Selection */}
        <Card title="2. Wire Colors" icon={Cable}>
          <p className="text-slate-400 text-sm mb-4 font-mono">
            Click to select wires found in your cable (in order):
          </p>

          <WireColorGrid
            colors={WIRE_COLORS}
            selectedColors={selectedColors}
            onToggle={toggleColor}
          />

          {selectedColors.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-500 text-sm font-mono">
                Selected ({selectedColors.length}):
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedColors.map((color, idx) => {
                  const wireColor = WIRE_COLORS.find(c => c.name === color);
                  return (
                    <div
                      key={`${color}-${idx}`}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 rounded"
                    >
                      <span className="text-slate-500 text-xs font-mono">{idx + 1}.</span>
                      <div
                        className="w-3 h-3 rounded-full border border-slate-500"
                        style={{ backgroundColor: wireColor?.hex }}
                      />
                      <span className="text-slate-300 text-xs font-mono">{color}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Section 3: Destination Connector */}
        <Card title="3. Destination Connector" icon={Cable}>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select
                label="Select destination connector"
                value={destConnectorId}
                onChange={(id) => { setDestConnectorId(id); setTerminationMap(null); }}
                options={connectorOptions}
              />
            </div>
            <Button
              variant={selectingFor === 'destination' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectingFor(selectingFor === 'destination' ? null : 'destination')}
            >
              {selectingFor === 'destination' ? 'Cancel' : 'Browse'}
            </Button>
          </div>

          {selectingFor === 'destination' && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 text-sm font-mono">
                Click a connector from the library below to select as destination
              </p>
            </div>
          )}

          {destConnector && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-mono text-emerald-400 text-sm mb-2">
                {destConnector.name}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {destConnector.pins.map(pin => (
                  <div
                    key={pin.id}
                    className="flex items-center gap-2 text-sm font-mono"
                  >
                    <span className="text-slate-500">Pin {pin.number}:</span>
                    <span className="text-slate-300">{pin.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            icon={Sparkles}
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            Generate Termination Map
          </Button>
        </div>

        {/* Section 4: Results */}
        {terminationMap && (
          <Card title="Termination Map" icon={Table} variant="highlight">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
                      Source Pin
                    </th>
                    <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
                      Wire Color
                    </th>
                    <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
                      Function
                    </th>
                    <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
                      Dest Pin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {terminationMap.map((pin, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-4 font-mono text-slate-300">
                        Pin {pin.sourcePin}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-600"
                            style={{ backgroundColor: pin.wireColor }}
                          />
                          <span className="font-mono text-slate-300 text-sm">
                            {pin.wireColorName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400 text-sm">
                        {pin.wireFunction}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        Pin {pin.destinationPin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <Button variant="secondary" size="sm" icon={Save} onClick={handleSave}>
                Save Diagram
              </Button>
              <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
                Print
              </Button>
            </div>
          </Card>
        )}

        {/* Connector Library */}
        <Card title="Connector Library" icon={Library}>
          {selectingFor && (
            <div className={`mb-4 p-3 rounded-lg border ${
              selectingFor === 'source'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <p className={`text-sm font-mono ${
                selectingFor === 'source' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                Selecting {selectingFor} connector - click one below
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(connectors).map(connector => {
              const isSelected = connector.id === sourceConnectorId || connector.id === destConnectorId;
              const isSource = connector.id === sourceConnectorId;
              const isDest = connector.id === destConnectorId;

              return (
                <div
                  key={connector.id}
                  onClick={() => handleSelectFromLibrary(connector)}
                  className={`
                    bg-slate-800/50
                    rounded-lg
                    p-4
                    transition-all
                    cursor-pointer
                    ${selectingFor ? 'hover:scale-105' : ''}
                    ${isSource ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20' : ''}
                    ${isDest ? 'border-2 border-amber-500 ring-2 ring-amber-500/20' : ''}
                    ${!isSelected ? 'border border-slate-700/50 hover:border-emerald-500/30' : ''}
                  `}
                >
                  {/* Connector thumbnail */}
                  <div className="
                    bg-slate-900
                    rounded
                    p-4
                    mb-3
                    flex
                    items-center
                    justify-center
                    min-h-[80px]
                    relative
                  ">
                    <Cable size={32} className={isSelected ? 'text-emerald-400' : 'text-slate-600'} />
                    {isSource && (
                      <span className="absolute top-1 right-1 text-xs font-mono bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                        SRC
                      </span>
                    )}
                    {isDest && (
                      <span className="absolute top-1 right-1 text-xs font-mono bg-amber-500 text-white px-1.5 py-0.5 rounded">
                        DST
                      </span>
                    )}
                  </div>

                  <h4 className="font-mono text-emerald-400 text-sm mb-1">
                    {connector.name}
                  </h4>
                  <p className="text-slate-500 text-xs font-mono">
                    {connector.pins.length} pins • {connector.category}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Connector Detail Modal */}
        <Modal
          isOpen={!!viewingConnector}
          onClose={() => {
            setViewingConnector(null);
            cancelEditingPins();
          }}
          title={viewingConnector?.name || 'Connector Details'}
          size="lg"
        >
          {viewingConnector && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <Cable size={48} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-mono text-lg text-emerald-400">{viewingConnector.name}</h3>
                  <p className="text-slate-500 font-mono text-sm">
                    {viewingConnector.pins.length} pins • {viewingConnector.category}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-slate-400 font-mono text-sm uppercase">Pin Configuration</h4>
                  {hasPermission('wirediagrams.edit') && !editingPins && (
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={startEditingPins}>
                      Edit Pins
                    </Button>
                  )}
                  {editingPins && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" icon={X} onClick={cancelEditingPins}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" icon={Check} onClick={savePinEdits}>
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {editingPins ? (
                  <div className="space-y-2">
                    {editedPins.map(pin => (
                      <div
                        key={pin.id}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700"
                      >
                        <span className="text-emerald-400 font-bold font-mono w-8">{pin.number}</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={pin.label}
                            onChange={(e) => updatePin(pin.id, 'label', e.target.value)}
                            placeholder="Label"
                            className="
                              bg-slate-900
                              border border-slate-600
                              rounded
                              px-2 py-1
                              font-mono text-sm text-slate-200
                              placeholder:text-slate-600
                              focus:outline-none focus:border-emerald-500/50
                            "
                          />
                          <input
                            type="text"
                            value={pin.function || ''}
                            onChange={(e) => updatePin(pin.id, 'function', e.target.value)}
                            placeholder="Function (optional)"
                            className="
                              bg-slate-900
                              border border-slate-600
                              rounded
                              px-2 py-1
                              font-mono text-sm text-amber-400
                              placeholder:text-slate-600
                              focus:outline-none focus:border-emerald-500/50
                            "
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {viewingConnector.pins.map(pin => (
                      <div
                        key={pin.id}
                        className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-sm font-mono"
                      >
                        <span className="text-emerald-400 font-bold">{pin.number}</span>
                        <span className="text-slate-300">{pin.label}</span>
                        {pin.function && (
                          <span className="text-amber-400 text-xs ml-auto">{pin.function}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Set as Default (Owner only) */}
              {user?.role === 'owner' && !editingPins && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-slate-400 font-mono text-sm">Default Configuration</h4>
                      <p className="text-slate-600 text-xs font-mono">
                        {isDefaultSaved(viewingConnector.id)
                          ? 'This pin configuration is saved as default'
                          : 'Save current pin labels as default for this connector'
                        }
                      </p>
                    </div>
                    <Button
                      variant={defaultSaved ? 'primary' : 'ghost'}
                      size="sm"
                      icon={Star}
                      onClick={setAsDefault}
                      disabled={defaultSaved}
                    >
                      {defaultSaved ? 'Saved!' : 'Set as Default'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSourceConnectorId(viewingConnector.id);
                    setViewingConnector(null);
                    setTerminationMap(null);
                    cancelEditingPins();
                  }}
                >
                  Use as Source
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDestConnectorId(viewingConnector.id);
                    setViewingConnector(null);
                    setTerminationMap(null);
                    cancelEditingPins();
                  }}
                >
                  Use as Destination
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTemplate>
  );
}
