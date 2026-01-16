<script lang="ts">
  import { confirmDialog } from '../stores/ui';

  function handleConfirm() {
    if ($confirmDialog.onConfirm) {
      $confirmDialog.onConfirm();
    }
    confirmDialog.close();
  }

  function handleCancel() {
    confirmDialog.close();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $confirmDialog.isOpen}
  <div class="dialog-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
      <h2 id="dialog-title" class="dialog-title">{$confirmDialog.title}</h2>
      <p class="dialog-message">{$confirmDialog.message}</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary" on:click={handleCancel}>
          Cancel
        </button>
        <button class="btn btn-danger" on:click={handleConfirm}>
          {$confirmDialog.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 900;
    padding: 16px;
  }

  .dialog {
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 320px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .dialog-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .dialog-message {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }
</style>
