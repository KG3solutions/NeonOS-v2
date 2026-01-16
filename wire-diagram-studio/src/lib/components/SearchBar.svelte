<script lang="ts">
  import { searchQuery } from '../stores/ui';

  let inputValue = $searchQuery;
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;

    // Debounce search updates
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      $searchQuery = inputValue;
    }, 300);
  }

  function clearSearch() {
    inputValue = '';
    $searchQuery = '';
  }
</script>

<div class="search-bar">
  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
  <input
    type="text"
    placeholder="Search diagrams..."
    value={inputValue}
    oninput={handleInput}
  />
  {#if inputValue}
    <button class="clear-btn" onclick={clearSearch} aria-label="Clear search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    flex: 1;
    max-width: 300px;
  }

  .search-bar:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .search-icon {
    width: 18px;
    height: 18px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    color: #111827;
    background: transparent;
    min-width: 0;
  }

  input::placeholder {
    color: #9ca3af;
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: #e5e7eb;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    background: #d1d5db;
  }

  .clear-btn svg {
    width: 12px;
    height: 12px;
    color: #6b7280;
  }
</style>
