<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { ConnectorTemplate, PinoutConfig, PinPosition } from '../types';
  import { templates } from '../stores/templates';
  import { showToast } from '../stores/ui';

  export let template: ConnectorTemplate;
  export let variant: 'male' | 'female' = 'female';

  const dispatch = createEventDispatcher<{
    save: PinoutConfig;
    cancel: void;
    download: void;
  }>();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let image: HTMLImageElement | null = null;
  let imageLoaded = false;

  // Pin configuration
  let pins: PinPosition[] = [];
  let pinSize = 15;
  let nextPinLabel = 1;

  // Display options
  let showPinNumber = true;
  let showWireColor = false;
  let showLedColor = false;

  // Mode
  let isRepositioning = false;
  let repositionIndex = -1;

  $: imageUrl = variant === 'male' ? template.maleImageUrl : template.femaleImageUrl;
  $: partNumber = variant === 'male' ? template.malePartNumber : template.femalePartNumber;

  onMount(() => {
    ctx = canvas?.getContext('2d');

    // Load existing pinout if available
    if (template.defaultPinout?.pins?.length > 0) {
      pins = [...template.defaultPinout.pins];
      pinSize = template.defaultPinout.pinSize || 15;
      showPinNumber = template.defaultPinout.displayOptions?.showPinNumber ?? true;
      showWireColor = template.defaultPinout.displayOptions?.showWireColor ?? false;
      showLedColor = template.defaultPinout.displayOptions?.showLedColor ?? false;
      nextPinLabel = Math.max(...pins.map(p => parseInt(p.pinLabel) || 0)) + 1;
    }

    loadImage();
  });

  function loadImage() {
    if (!imageUrl) {
      showToast(`No ${variant} image available`, 'error');
      return;
    }

    image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      imageLoaded = true;
      setupCanvas();
    };
    image.onerror = () => {
      showToast('Failed to load image', 'error');
    };
    image.src = imageUrl;
  }

  function setupCanvas() {
    if (!canvas || !ctx || !image) return;

    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = 500;

    let { width, height } = image;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width *= ratio;
    height *= ratio;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    draw();
  }

  function draw() {
    if (!ctx || !canvas || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawPins();
  }

  function drawPins() {
    if (!ctx) return;

    pins.forEach((pin, index) => {
      const isBeingRepositioned = isRepositioning && repositionIndex === index;

      // Draw pin circle
      ctx!.beginPath();
      ctx!.arc(pin.x, pin.y, pinSize, 0, 2 * Math.PI);
      ctx!.fillStyle = isBeingRepositioned ? '#22c55e' : '#d946ef';
      ctx!.fill();

      // White border
      ctx!.strokeStyle = 'white';
      ctx!.lineWidth = 2;
      ctx!.stroke();

      // Pin label
      ctx!.fillStyle = 'white';
      ctx!.font = `bold ${Math.max(10, pinSize * 0.7)}px Arial`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(pin.pinLabel, pin.x, pin.y);
    });
  }

  function handleCanvasClick(e: MouseEvent) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (isRepositioning && repositionIndex >= 0) {
      // Update existing pin position
      pins[repositionIndex] = { ...pins[repositionIndex], x, y };
      isRepositioning = false;
      repositionIndex = -1;
    } else {
      // Add new pin
      pins = [
        ...pins,
        {
          pinLabel: String(nextPinLabel),
          x,
          y
        }
      ];
      nextPinLabel++;
    }

    draw();
  }

  function startReposition(index: number) {
    isRepositioning = true;
    repositionIndex = index;
    showToast('Click on the image to place the pin', 'info');
    draw();
  }

  function cancelReposition() {
    isRepositioning = false;
    repositionIndex = -1;
    draw();
  }

  function removePin(index: number) {
    pins = pins.filter((_, i) => i !== index);
    draw();
  }

  function updatePinLabel(index: number, label: string) {
    pins[index] = { ...pins[index], pinLabel: label };
    draw();
  }

  function clearAllPins() {
    pins = [];
    nextPinLabel = 1;
    draw();
  }

  function handleSave() {
    if (pins.length === 0) {
      showToast('Please add at least one pin', 'error');
      return;
    }

    const pinout: PinoutConfig = {
      pins,
      pinSize,
      displayOptions: {
        showPinNumber,
        showWireColor,
        showLedColor
      }
    };

    dispatch('save', pinout);
  }

  function handleDownload() {
    if (pins.length === 0) {
      showToast('Please add pins before downloading', 'error');
      return;
    }
    dispatch('download');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Switch variant if both images exist
  function switchVariant() {
    if (variant === 'female' && template.maleImageUrl) {
      variant = 'male';
    } else if (variant === 'male' && template.femaleImageUrl) {
      variant = 'female';
    }
    loadImage();
  }
</script>

<div class="pinout-editor">
  <header class="editor-header">
    <button class="back-btn" on:click={handleCancel}>
      <span class="icon">←</span>
      Cancel
    </button>
    <h1>Configure Pinout: {template.name}</h1>
  </header>

  <div class="editor-content">
    <!-- Variant Selector -->
    {#if template.maleImageUrl && template.femaleImageUrl}
      <div class="variant-selector">
        <button
          class:active={variant === 'female'}
          on:click={() => { variant = 'female'; loadImage(); }}
        >
          Female
          {#if template.femalePartNumber}
            <span class="part-num">({template.femalePartNumber})</span>
          {/if}
        </button>
        <button
          class:active={variant === 'male'}
          on:click={() => { variant = 'male'; loadImage(); }}
        >
          Male
          {#if template.malePartNumber}
            <span class="part-num">({template.malePartNumber})</span>
          {/if}
        </button>
      </div>
    {/if}

    <!-- Instructions -->
    <div class="instructions" class:repositioning={isRepositioning}>
      {#if isRepositioning}
        <p>Click on the image to place Pin {pins[repositionIndex]?.pinLabel}</p>
        <button class="cancel-btn" on:click={cancelReposition}>Cancel</button>
      {:else}
        <p>Click on the connector image to add pins. Pins will be numbered automatically.</p>
      {/if}
    </div>

    <!-- Canvas -->
    <div class="canvas-container">
      {#if !imageLoaded}
        <div class="loading">Loading image...</div>
      {/if}
      <canvas
        bind:this={canvas}
        on:click={handleCanvasClick}
        class:hidden={!imageLoaded}
        style="cursor: crosshair"
      ></canvas>
    </div>

    <!-- Pin Size Slider -->
    <div class="control-group">
      <label>
        Pin Size: {pinSize}px
        <input
          type="range"
          min="8"
          max="40"
          bind:value={pinSize}
          on:input={draw}
        />
      </label>
    </div>

    <!-- Pin List -->
    {#if pins.length > 0}
      <div class="pin-list">
        <h3>Pins ({pins.length})</h3>
        <div class="pin-items">
          {#each pins as pin, index}
            <div class="pin-item">
              <input
                type="text"
                value={pin.pinLabel}
                on:input={(e) => updatePinLabel(index, e.currentTarget.value)}
                class="pin-label-input"
              />
              <span class="pin-coords">({pin.x}, {pin.y})</span>
              <button
                class="reposition-btn"
                on:click={() => startReposition(index)}
                title="Move pin"
              >
                ↻
              </button>
              <button
                class="remove-btn"
                on:click={() => removePin(index)}
                title="Remove pin"
              >
                ×
              </button>
            </div>
          {/each}
        </div>
        <button class="clear-btn" on:click={clearAllPins}>Clear All Pins</button>
      </div>
    {/if}

    <!-- Display Options -->
    <div class="display-options">
      <h3>Default Display Options</h3>
      <label>
        <input type="checkbox" bind:checked={showPinNumber} />
        Show Pin Number
      </label>
      <label>
        <input type="checkbox" bind:checked={showWireColor} />
        Show Wire Color
      </label>
      <label>
        <input type="checkbox" bind:checked={showLedColor} />
        Show LED/Function Color
      </label>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="btn-secondary" on:click={handleCancel}>Cancel</button>
      <button class="btn-secondary" on:click={handleDownload} disabled={pins.length === 0}>
        Download JSON
      </button>
      <button class="btn-primary" on:click={handleSave} disabled={pins.length === 0}>
        Save & Sync to Notion
      </button>
    </div>
  </div>
</div>

<style>
  .pinout-editor {
    min-height: 100vh;
    background: #f9fafb;
  }

  .editor-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .editor-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
  }

  .back-btn:hover {
    background: #e5e7eb;
  }

  .editor-content {
    padding: 16px;
    max-width: 900px;
    margin: 0 auto;
  }

  .variant-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .variant-selector button {
    flex: 1;
    padding: 12px 16px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .variant-selector button.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
  }

  .variant-selector .part-num {
    font-size: 0.85em;
    opacity: 0.7;
  }

  .instructions {
    padding: 12px 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .instructions.repositioning {
    background: #dcfce7;
    border-color: #86efac;
  }

  .instructions p {
    margin: 0;
    color: #1e40af;
  }

  .instructions.repositioning p {
    color: #166534;
  }

  .cancel-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
  }

  .canvas-container {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    margin-bottom: 16px;
  }

  canvas {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  canvas.hidden {
    display: none;
  }

  .loading {
    color: #6b7280;
  }

  .control-group {
    margin-bottom: 16px;
  }

  .control-group label {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    color: #374151;
  }

  .control-group input[type="range"] {
    flex: 1;
    max-width: 300px;
  }

  .pin-list {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .pin-list h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    color: #374151;
  }

  .pin-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .pin-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .pin-label-input {
    width: 40px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
  }

  .pin-coords {
    font-size: 0.8rem;
    color: #6b7280;
    font-family: monospace;
  }

  .reposition-btn,
  .remove-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .reposition-btn {
    background: #dbeafe;
    color: #2563eb;
  }

  .reposition-btn:hover {
    background: #bfdbfe;
  }

  .remove-btn {
    background: #fee2e2;
    color: #dc2626;
  }

  .remove-btn:hover {
    background: #fecaca;
  }

  .clear-btn {
    padding: 8px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    cursor: pointer;
    font-weight: 500;
  }

  .clear-btn:hover {
    background: #fee2e2;
  }

  .display-options {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .display-options h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    color: #374151;
  }

  .display-options label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #4b5563;
    cursor: pointer;
  }

  .display-options input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .btn-primary,
  .btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f9fafb;
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .editor-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }
</style>
