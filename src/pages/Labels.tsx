import { useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { Tag, Save, Printer, QrCode, Type, Image, Trash2, Move } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Input, Select } from '../components';
import { useInventory } from '../state';
import { LabelElement } from '../types';

export function Labels() {
  const { items } = useInventory();

  const [selectedItem, setSelectedItem] = useState('');
  const [labelSize, setLabelSize] = useState('medium');
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-1');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [elements, setElements] = useState<LabelElement[]>([
    {
      id: 'el-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 180,
      height: 24,
      content: 'Item Name',
      fontSize: 14,
      fontWeight: 'bold',
    },
    {
      id: 'el-2',
      type: 'qrcode',
      x: 10,
      y: 45,
      width: 80,
      height: 80,
      content: 'item-id',
    },
    {
      id: 'el-3',
      type: 'text',
      x: 100,
      y: 55,
      width: 120,
      height: 18,
      content: 'SKU: XXX-000',
      fontSize: 11,
    },
  ]);

  const itemOptions = [
    { value: '', label: 'Select Item' },
    ...Object.values(items).map(item => ({
      value: item.id,
      label: `${item.sku} - ${item.name}`,
    })),
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small (2" x 1")' },
    { value: 'medium', label: 'Medium (3" x 2")' },
    { value: 'large', label: 'Large (4" x 3")' },
    { value: 'custom', label: 'Custom Size' },
  ];

  // Custom size in inches
  const [customWidthInches, setCustomWidthInches] = useState(3);
  const [customHeightInches, setCustomHeightInches] = useState(1.5);

  // DPI for converting inches to pixels (96 DPI is standard web)
  const DPI = 96;

  // Get label dimensions based on size (returns pixels for display)
  const getLabelDimensions = () => {
    // Standard label sizes in inches
    const sizes = {
      small: { width: 2, height: 1 },
      medium: { width: 3, height: 2 },
      large: { width: 4, height: 3 },
    };

    if (labelSize === 'custom') {
      return {
        width: Math.round(customWidthInches * DPI),
        height: Math.round(customHeightInches * DPI),
        widthInches: customWidthInches,
        heightInches: customHeightInches,
      };
    }

    const size = sizes[labelSize as keyof typeof sizes] || sizes.medium;
    return {
      width: Math.round(size.width * DPI),
      height: Math.round(size.height * DPI),
      widthInches: size.width,
      heightInches: size.height,
    };
  };

  const labelDimensions = getLabelDimensions();

  const selectedItemData = selectedItem ? items[selectedItem] : null;

  const addElement = (type: LabelElement['type']) => {
    const newElement: LabelElement = {
      id: `el-${Date.now()}`,
      type,
      x: 10,
      y: 10 + elements.length * 30,
      width: type === 'qrcode' ? 60 : 150,
      height: type === 'qrcode' ? 60 : 25,
      content: type === 'text' ? 'New Text' : type === 'qrcode' ? 'QR Data' : '',
      fontSize: 12,
    };
    setElements([...elements, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Drag handlers for element positioning
  const handleMouseDown = (e: ReactMouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsDragging(true);

    const element = elements.find(el => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Store the offset between mouse position and element position within the canvas
      const mouseXInCanvas = e.clientX - rect.left;
      const mouseYInCanvas = e.clientY - rect.top;
      setDragStart({
        x: mouseXInCanvas - element.x,
        y: mouseYInCanvas - element.y
      });
    }
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // Calculate new position relative to canvas
    const mouseXInCanvas = e.clientX - rect.left;
    const mouseYInCanvas = e.clientY - rect.top;

    const newX = mouseXInCanvas - dragStart.x;
    const newY = mouseYInCanvas - dragStart.y;

    // Constrain to canvas bounds
    const element = elements.find(el => el.id === selectedElementId);
    if (element) {
      const x = Math.max(0, Math.min(newX, canvasWidth - element.width));
      const y = Math.max(0, Math.min(newY, canvasHeight - element.height));
      updateElement(selectedElementId, { x: Math.round(x), y: Math.round(y) });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Resize handlers
  const handleResizeMouseDown = (e: ReactMouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);

    const element = elements.find(el => el.id === selectedElementId);
    if (element) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height
      });
    }
  };

  const handleResizeMouseMove = (e: ReactMouseEvent) => {
    if (!isResizing || !selectedElementId || !resizeHandle) return;

    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;

    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;

    // Calculate new dimensions based on handle
    // For east/west handles, only width changes
    // For north/south handles, only height changes
    // For corner handles, both change
    if (resizeHandle.includes('e')) {
      newWidth = Math.max(20, resizeStart.width + dx);
    }
    if (resizeHandle.includes('w')) {
      newWidth = Math.max(20, resizeStart.width - dx);
    }
    if (resizeHandle.includes('s')) {
      newHeight = Math.max(15, resizeStart.height + dy);
    }
    if (resizeHandle.includes('n')) {
      newHeight = Math.max(15, resizeStart.height - dy);
    }

    // If Shift is held, maintain aspect ratio
    if (e.shiftKey && resizeHandle.length === 2) { // Corner handles only
      const aspectRatio = resizeStart.width / resizeStart.height;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Width changed more, adjust height to maintain ratio
        newHeight = Math.max(15, newWidth / aspectRatio);
      } else {
        // Height changed more, adjust width to maintain ratio
        newWidth = Math.max(20, newHeight * aspectRatio);
      }
    }

    // Position stays fixed - resize from the anchor point opposite to the handle
    // We only update width/height, keeping position locked
    updateElement(selectedElementId, {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    });
  };

  // Print label
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelWidth = labelDimensions.width;
    const labelHeight = labelDimensions.height;

    const elementsHtml = elements.map(el => {
      if (el.type === 'text') {
        const displayContent = selectedItemData
          ? el.content.replace('Item Name', selectedItemData.name).replace('XXX-000', selectedItemData.sku)
          : el.content;
        return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; font-size: ${el.fontSize}px; font-weight: ${el.fontWeight || 'normal'}; font-family: monospace;">${displayContent}</div>`;
      }
      if (el.type === 'qrcode') {
        return `<div style="position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR</div>`;
      }
      return '';
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Label Print</title></head>
      <body style="margin: 0; padding: 20px;">
        <div style="position: relative; width: ${labelWidth}px; height: ${labelHeight}px; border: 1px solid #000; background: #fff;">
          ${elementsHtml}
        </div>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <PageTemplate
      title="Labels Studio"
      actions={
        <>
          <Button variant="secondary" icon={Save}>
            Save Template
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Print
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Settings & Elements */}
        <div className="space-y-6">
          {/* Item Selection */}
          <Card title="Item Selection" icon={Tag}>
            <div className="space-y-4">
              <Select
                label="Select Item"
                value={selectedItem}
                onChange={setSelectedItem}
                options={itemOptions}
              />

              {selectedItemData && (
                <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                  <div className="text-emerald-400 font-mono text-sm">
                    {selectedItemData.name}
                  </div>
                  <div className="text-slate-500 font-mono text-xs">
                    SKU: {selectedItemData.sku}
                  </div>
                </div>
              )}

              <Select
                label="Label Size"
                value={labelSize}
                onChange={setLabelSize}
                options={sizeOptions}
              />

              {labelSize === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Width (inches)"
                    type="number"
                    value={String(customWidthInches)}
                    onChange={(e) => setCustomWidthInches(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  />
                  <Input
                    label="Height (inches)"
                    type="number"
                    value={String(customHeightInches)}
                    onChange={(e) => setCustomHeightInches(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Add Elements */}
          <Card title="Add Elements">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Type}
                onClick={() => addElement('text')}
              >
                Text
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={QrCode}
                onClick={() => addElement('qrcode')}
              >
                QR
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Image}
                onClick={() => addElement('image')}
              >
                Image
              </Button>
            </div>
          </Card>

          {/* Element List */}
          <Card title="Elements">
            <div className="space-y-2">
              {elements.map((element, idx) => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElementId(element.id)}
                  className={`
                    flex items-center justify-between
                    p-2
                    rounded
                    cursor-pointer
                    transition-colors
                    ${selectedElementId === element.id
                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                      : 'bg-slate-800/30 border border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}</span>
                    {element.type === 'text' && <Type size={14} className="text-slate-500" />}
                    {element.type === 'qrcode' && <QrCode size={14} className="text-slate-500" />}
                    {element.type === 'image' && <Image size={14} className="text-slate-500" />}
                    <span className="text-sm font-mono text-slate-300">
                      {element.type === 'text' ? element.content.slice(0, 12) : element.type.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeElement(element.id); }}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {elements.length === 0 && (
                <p className="text-slate-500 text-sm font-mono text-center py-4">
                  No elements added
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Center - Canvas Preview */}
        <div className="lg:col-span-2">
          <Card title="Preview">
            <p className="text-slate-500 text-xs font-mono mb-4 flex items-center gap-2">
              <Move size={12} /> Click and drag elements to reposition
            </p>

            {/* Label Canvas */}
            <div className="flex justify-center p-4 bg-slate-900/50 rounded-lg">
              <div
                ref={canvasRef}
                onMouseMove={(e) => {
                  handleMouseMove(e);
                  handleResizeMouseMove(e);
                }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="
                  relative
                  bg-white
                  rounded
                  shadow-lg
                  select-none
                "
                style={{
                  width: `${labelDimensions.width}px`,
                  height: `${labelDimensions.height}px`,
                }}
              >
                {elements.map((element) => (
                  <div
                    key={element.id}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    className={`
                      absolute
                      cursor-move
                      ${selectedElementId === element.id ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}
                    `}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                    }}
                  >
                    {element.type === 'text' && (
                      <span
                        className="block whitespace-nowrap overflow-hidden"
                        style={{
                          fontSize: element.fontSize,
                          fontWeight: element.fontWeight,
                          fontFamily: 'monospace',
                          color: '#1a1a1a',
                          lineHeight: 1.2,
                        }}
                      >
                        {selectedItemData
                          ? element.content
                              .replace('Item Name', selectedItemData.name)
                              .replace('XXX-000', selectedItemData.sku)
                          : element.content}
                      </span>
                    )}
                    {element.type === 'qrcode' && (
                      <div
                        className="bg-white flex items-center justify-center border border-slate-300"
                        style={{ width: element.width, height: element.height }}
                      >
                        <QrCode
                          size={Math.min(element.width, element.height) * 0.85}
                          className="text-slate-900"
                        />
                      </div>
                    )}
                    {element.type === 'image' && (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center border border-slate-300">
                        <Image size={Math.min(element.width, element.height) * 0.5} className="text-slate-500" />
                      </div>
                    )}

                    {/* Resize Handles - only show for selected element */}
                    {selectedElementId === element.id && (
                      <>
                        {/* Corner handles */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                          className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-500 border border-white rounded-sm cursor-nw-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border border-white rounded-sm cursor-ne-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 border border-white rounded-sm cursor-sw-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border border-white rounded-sm cursor-se-resize"
                        />
                        {/* Edge handles */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-emerald-500 border border-white rounded-sm cursor-n-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-emerald-500 border border-white rounded-sm cursor-s-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                          className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-3 bg-emerald-500 border border-white rounded-sm cursor-w-resize"
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                          className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-3 bg-emerald-500 border border-white rounded-sm cursor-e-resize"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Size indicator */}
            <div className="flex justify-center gap-4 mt-4">
              <span className="text-slate-500 text-sm font-mono">
                {labelDimensions.widthInches}" × {labelDimensions.heightInches}"
              </span>
            </div>
          </Card>

          {/* Element Editor */}
          {selectedElement && (
            <Card title="Edit Element" className="mt-6">
              <div className="space-y-4">
                <Select
                  label="Select Element"
                  value={selectedElementId || ''}
                  onChange={(id) => setSelectedElementId(id)}
                  options={elements.map((el, idx) => ({
                    value: el.id,
                    label: `${idx + 1}. ${el.type}${el.type === 'text' ? `: ${el.content.slice(0, 10)}` : ''}`,
                  }))}
                />

                {selectedElement.type === 'text' && (
                  <div className="space-y-4">
                    <Input
                      label="Text Content"
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      placeholder="Enter label text..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Font Size (px)"
                        type="number"
                        value={String(selectedElement.fontSize || 12)}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                      />
                      <Select
                        label="Font Weight"
                        value={selectedElement.fontWeight || 'normal'}
                        onChange={(val) => updateElement(selectedElement.id, { fontWeight: val as 'normal' | 'bold' })}
                        options={[
                          { value: 'normal', label: 'Normal' },
                          { value: 'bold', label: 'Bold' },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === 'qrcode' && (
                  <Input
                    label="QR Code Data"
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    placeholder="Data to encode..."
                  />
                )}

                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="X"
                    type="number"
                    value={String(selectedElement.x)}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Y"
                    type="number"
                    value={String(selectedElement.y)}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Width"
                    type="number"
                    value={String(selectedElement.width)}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 10 })}
                  />
                  <Input
                    label="Height"
                    type="number"
                    value={String(selectedElement.height)}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 10 })}
                  />
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  Position: ({selectedElement.x}, {selectedElement.y}) | Size: {selectedElement.width}×{selectedElement.height}
                </div>
              </div>
            </Card>
          )}

          {!selectedElement && elements.length > 0 && (
            <Card className="mt-6">
              <p className="text-slate-500 text-sm font-mono text-center py-4">
                Click an element to edit its properties
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
