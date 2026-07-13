<template>
  <div class="state-view">
    <div class="view-header">
      <h1>Gestion de l'état</h1>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <div v-if="postTransitionWarnings.length > 0" class="warning-banner">
      <p class="warning-title">⚠️ Répartition effectuée avec des avertissements :</p>
      <ul>
        <li v-for="w in postTransitionWarnings" :key="w">{{ w }}</li>
      </ul>
    </div>

    <div class="state-card">
      <div class="state-info">
        <p class="state-label">État actuel</p>
        <span class="state-badge" :class="`state--${appStateStore.state}`">
          {{ STATE_LABELS[appStateStore.state] ?? appStateStore.state }}
        </span>
      </div>

      <p class="state-description">{{ stateDescription }}</p>

      <div class="state-actions">
        <button
          class="btn btn-secondary"
          :disabled="!prevState || appStateStore.loading"
          @click="goTo(prevState!)"
        >
          ← Revenir à « {{ prevState ? STATE_LABELS[prevState] : '—' }} »
        </button>
        <button
          class="btn btn-primary"
          :disabled="!nextState || appStateStore.loading"
          @click="goTo(nextState!)"
        >
          Passer à « {{ nextState ? STATE_LABELS[nextState] : '—' }} » →
        </button>
      </div>
    </div>

    <div class="state-timeline">
      <div
        v-for="s in STATE_ORDER"
        :key="s"
        class="timeline-step"
        :class="{
          'step--active': s === appStateStore.state,
          'step--done': STATE_ORDER.indexOf(s) < STATE_ORDER.indexOf(appStateStore.state),
        }"
      >
        <div class="step-dot"></div>
        <span class="step-label">{{ STATE_LABELS[s] }}</span>
      </div>
    </div>

    <!-- Confirm transition with warnings -->
    <ConfirmModal
      v-if="appStateStore.pendingTransition"
      title="Confirmer le changement d'état"
      :message="`Passer de « ${STATE_LABELS[appStateStore.pendingTransition.from]} » à « ${STATE_LABELS[appStateStore.pendingTransition.to]} » ?`"
      :warnings="appStateStore.pendingTransition.warnings"
      confirm-text="Confirmer quand même"
      @confirm="confirmTransition"
      @cancel="appStateStore.cancelTransition()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStateStore } from '@/stores/appState'
import { useAuthStore } from '@/stores/auth'
import type { AppStateValue } from '@/stores/auth'
import ConfirmModal from '@/components/ConfirmModal.vue'

const appStateStore = useAppStateStore()
const auth = useAuthStore()
const errorMsg = ref<string | null>(null)
const postTransitionWarnings = ref<string[]>([])

const STATE_ORDER: AppStateValue[] = ['preparation', 'reperage', 'vote', 'repartition', 'publication']

const STATE_LABELS: Record<AppStateValue, string> = {
  preparation: 'Préparation',
  reperage: 'Repérage',
  vote: 'Vote',
  repartition: 'Répartition',
  publication: 'Publication',
}

const STATE_DESCRIPTIONS: Record<AppStateValue, string> = {
  preparation: 'Les professeurs créent et modifient leurs projets.',
  reperage: 'Les projets sont visibles par tous. Les étudiants peuvent les consulter.',
  vote: 'Les étudiants peuvent voter pour leurs projets préférés (max 3).',
  repartition: 'Le doyen peut calculer et ajuster la répartition des étudiants.',
  publication: 'La répartition est publiée et visible par tous.',
}

const stateDescription = computed(() => STATE_DESCRIPTIONS[appStateStore.state] ?? '')

const currentIndex = computed(() => STATE_ORDER.indexOf(appStateStore.state))
const prevState = computed<AppStateValue | null>(() =>
  currentIndex.value > 0 ? STATE_ORDER[currentIndex.value - 1] : null
)
const nextState = computed<AppStateValue | null>(() =>
  currentIndex.value < STATE_ORDER.length - 1 ? STATE_ORDER[currentIndex.value + 1] : null
)

async function goTo(targetState: AppStateValue) {
  errorMsg.value = null
  postTransitionWarnings.value = []
  try {
    const result = await appStateStore.changeState(targetState, false)
    if (!result.requiresConfirmation) {
      auth.appState = targetState
      postTransitionWarnings.value = result.warnings ?? []
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du changement d\'état.'
  }
}

async function confirmTransition() {
  const target = appStateStore.pendingTransition?.to
  if (!target) return
  postTransitionWarnings.value = []
  try {
    const result = await appStateStore.changeState(target, true)
    auth.appState = appStateStore.state
    postTransitionWarnings.value = result.warnings ?? []
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du changement d\'état.'
  }
}

onMounted(async () => {
  try {
    await appStateStore.fetchState()
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du chargement de l\'état.'
  }
})
</script>

<style scoped>
.state-view {
  max-width: 750px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1a1a2e;
}

.error-banner {
  background: #fff0f3;
  border: 1px solid #e94560;
  color: #e94560;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.warning-banner {
  background: #fff8e1;
  border: 1px solid #f59e0b;
  color: #92400e;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.warning-title {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.warning-banner ul {
  margin: 0;
  padding-left: 1.25rem;
}

.warning-banner li {
  font-size: 0.9rem;
  line-height: 1.6;
}

.state-card {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.state-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.state-label {
  margin: 0;
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.state-badge {
  display: inline-block;
  font-size: 1rem;
  padding: 4px 16px;
  border-radius: 16px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.state--preparation { background: #6c757d; }
.state--reperage    { background: #0d6efd; }
.state--vote        { background: #198754; }
.state--repartition { background: #fd7e14; }
.state--publication { background: #dc3545; }

.state-description {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
}

.state-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s, background 0.2s;
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #e94560;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

/* Timeline */
.state-timeline {
  display: flex;
  align-items: flex-start;
  gap: 0;
  background: white;
  border-radius: 10px;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.timeline-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.timeline-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}

.step--done:not(:last-child)::after {
  background: #1a1a2e;
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0e0e0;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e0e0e0;
  z-index: 1;
  transition: background 0.3s;
}

.step--done .step-dot {
  background: #1a1a2e;
  box-shadow: 0 0 0 2px #1a1a2e;
}

.step--active .step-dot {
  background: #e94560;
  box-shadow: 0 0 0 2px #e94560;
  transform: scale(1.3);
}

.step-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #aaa;
  text-align: center;
  font-weight: 500;
}

.step--done .step-label {
  color: #1a1a2e;
}

.step--active .step-label {
  color: #e94560;
  font-weight: 700;
}
</style>
