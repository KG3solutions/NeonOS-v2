<script lang="ts">
  import { toasts } from '../stores/ui';

  function getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  }
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}" role="alert">
      <span class="toast-icon">{getIcon(toast.type)}</span>
      <span class="toast-message">{toast.message}</span>
      <button
        class="toast-dismiss"
        on:click={() => toasts.dismiss(toast.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: calc(100% - 32px);
    max-width: 400px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    pointer-events: auto;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: #059669;
    color: white;
  }

  .toast-error {
    background: #dc2626;
    color: white;
  }

  .toast-info {
    background: #2563eb;
    color: white;
  }

  .toast-icon {
    font-weight: bold;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
  }

  .toast-dismiss {
    background: transparent;
    border: none;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    padding: 4px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .toast-dismiss:hover {
    opacity: 1;
  }
</style>
