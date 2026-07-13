<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-container" :class="{ 'modal--danger': dangerMode }">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="btn-close" @click="emit('cancel')">&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-message">{{ message }}</p>

        <div v-if="warnings && warnings.length > 0" class="warnings-box">
          <p class="warnings-title">Attention :</p>
          <ul>
            <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="emit('cancel')">Annuler</button>
        <button
          class="btn"
          :class="dangerMode ? 'btn-danger' : 'btn-primary'"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message: string
    warnings?: string[]
    confirmText?: string
    dangerMode?: boolean
  }>(),
  {
    warnings: () => [],
    confirmText: 'Confirmer',
    dangerMode: false,
  }
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal--danger .modal-header {
  background: #e94560;
  color: white;
}

.modal--danger .modal-header h2 {
  color: white;
}

.modal--danger .btn-close {
  color: rgba(255, 255, 255, 0.8);
}

.modal--danger .btn-close:hover {
  color: white;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: #1a1a2e;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1;
  padding: 0 4px;
}

.btn-close:hover {
  color: white;
}

.modal-body {
  padding: 1.5rem;
}

.modal-message {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #333;
  line-height: 1.5;
}

.warnings-box {
  background: #fff8e1;
  border: 1px solid #ffd54f;
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

.warnings-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  font-size: 0.85rem;
  color: #f57c00;
}

.warnings-box ul {
  margin: 0;
  padding-left: 1.25rem;
}

.warnings-box li {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.25rem;
}

.warnings-box li:last-child {
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-danger {
  background: #e94560;
  color: white;
}

.btn-danger:hover {
  opacity: 0.85;
}
</style>
