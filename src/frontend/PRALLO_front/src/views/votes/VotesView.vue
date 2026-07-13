<template>
  <div class="votes-view">
    <div class="view-header">
      <h1>Mes votes</h1>
      <span class="vote-counter" :class="{ full: votesStore.votes.length >= 3 }">
        {{ votesStore.votes.length }}/3 vote{{ votesStore.votes.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <div v-if="votesStore.loading" class="loading-msg">Chargement de vos votes...</div>

    <div v-else-if="votesStore.votes.length === 0" class="empty-state">
      <p>Vous n'avez pas encore voté.</p>
      <p class="hint">Rendez-vous dans la liste des projets pour voter.</p>
    </div>

    <div v-else class="slots">
      <p v-if="auth.can('vote') && votesStore.votes.length > 1" class="drag-hint">
        ↕ Glissez un vote sur une autre case pour échanger leurs priorités
      </p>

      <div
        v-for="priority in 3"
        :key="priority"
        class="slot"
        :class="{
          'slot--occupied': !!getVoteAt(priority),
          'slot--empty': !getVoteAt(priority),
          'slot--drop-target': dragOverPriority === priority && draggingPriority !== priority && !!getVoteAt(priority),
        }"
        @dragover.prevent="dragOverPriority = priority"
        @dragleave="dragOverPriority = null"
        @drop.prevent="onDrop(priority)"
      >
        <div class="slot-label">
          <span class="priority-badge" :class="`priority--${priority}`">
            {{ priority }}{{ priority === 1 ? 'er' : 'ème' }} choix
          </span>
        </div>

        <!-- Vote occupant la case -->
        <div
          v-if="getVoteAt(priority)"
          class="vote-card"
          :class="{ 'vote-card--dragging': draggingPriority === priority }"
          :draggable="auth.can('vote')"
          @dragstart="onDragStart(priority, $event)"
          @dragend="onDragEndNative"
          @dragover.prevent="dragOverPriority = priority"
          @drop.prevent="onDrop(priority)"
        >
          <div v-if="auth.can('vote')" class="drag-handle" title="Glisser pour réordonner">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="4" cy="2.5" r="1.3"/><circle cx="10" cy="2.5" r="1.3"/>
              <circle cx="4" cy="7" r="1.3"/><circle cx="10" cy="7" r="1.3"/>
              <circle cx="4" cy="11.5" r="1.3"/><circle cx="10" cy="11.5" r="1.3"/>
            </svg>
          </div>

          <div class="vote-info">
            <div class="project-title-row">
              <span class="project-title">{{ getVoteAt(priority)!.project.title }}</span>
              <span v-if="getVoteAt(priority)!.project.isMandatory" class="mandatory-icon" title="Obligatoire">!</span>
            </div>
            <span class="professor-name">
              {{ getVoteAt(priority)!.project.professor.firstName }}
              {{ getVoteAt(priority)!.project.professor.lastName }}
            </span>
          </div>

          <button
            v-if="auth.can('vote')"
            class="btn btn-delete"
            :disabled="saving"
            @click="confirmRemove(getVoteAt(priority)!.id)"
          >
            Supprimer
          </button>
        </div>

        <!-- Case vide -->
        <div v-else class="slot-empty">
          <span>—</span>
        </div>
      </div>
    </div>

    <div v-if="saveSuccess" class="success-banner">✓ Enregistrement pris en compte</div>

    <div class="info-box">
      <p>Vous pouvez voter pour au maximum 3 projets. Glissez les cartes pour modifier l'ordre de vos préférences.</p>
    </div>

    <ConfirmModal
      v-if="removeTarget !== null"
      title="Supprimer le vote"
      message="Voulez-vous supprimer ce vote ? Vos autres votes seront réordonnés automatiquement."
      confirm-text="Supprimer"
      :danger-mode="true"
      @confirm="executeRemove"
      @cancel="removeTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useVotesStore } from '@/stores/votes'
import { useAuthStore } from '@/stores/auth'
import type { Vote } from '@/stores/votes'
import ConfirmModal from '@/components/ConfirmModal.vue'

const votesStore = useVotesStore()
const auth = useAuthStore()
const removeTarget = ref<number | null>(null)
const errorMsg = ref<string | null>(null)
const saving = ref(false)
const saveSuccess = ref(false)

const draggingPriority = ref<number | null>(null)
const dragOverPriority = ref<number | null>(null)

function getVoteAt(priority: number): Vote | undefined {
  return votesStore.votes.find((v) => v.priority === priority)
}

function onDragStart(priority: number, event: DragEvent) {
  draggingPriority.value = priority
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragEndNative() {
  draggingPriority.value = null
  dragOverPriority.value = null
}

async function onDrop(targetPriority: number) {
  const fromPriority = draggingPriority.value
  draggingPriority.value = null
  dragOverPriority.value = null

  if (fromPriority === null || fromPriority === targetPriority) return

  const fromVote = getVoteAt(fromPriority)
  const toVote = getVoteAt(targetPriority)

  // Both slots must be occupied — no gaps allowed
  if (!fromVote || !toVote) return

  // Swap priorities locally immediately
  fromVote.priority = targetPriority as 1 | 2 | 3
  toVote.priority = fromPriority as 1 | 2 | 3

  // Persist to backend — send explicit {id, priority} pairs
  const updates: { id: number; priority: 1 | 2 | 3 }[] = [
    { id: fromVote.id, priority: targetPriority as 1 | 2 | 3 },
    { id: toVote.id, priority: fromPriority as 1 | 2 | 3 },
  ]

  saving.value = true
  errorMsg.value = null
  try {
    await votesStore.reorderVotes(updates)
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 2000)
  } catch (e: any) {
    // Revert on error
    fromVote.priority = fromPriority as 1 | 2 | 3
    if (toVote) toVote.priority = targetPriority as 1 | 2 | 3
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du réordonnancement.'
  } finally {
    saving.value = false
  }
}

function confirmRemove(voteId: number) {
  removeTarget.value = voteId
}

async function executeRemove() {
  if (removeTarget.value === null) return
  try {
    await votesStore.removeVote(removeTarget.value)
    removeTarget.value = null
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors de la suppression du vote.'
    removeTarget.value = null
  }
}

onMounted(async () => {
  try {
    await votesStore.fetchMyVotes()
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message ?? 'Erreur lors du chargement des votes.'
  }
})
</script>

<style scoped>
.votes-view {
  max-width: 680px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.view-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1a1a2e;
}

.vote-counter {
  background: #1a1a2e;
  color: white;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.vote-counter.full {
  background: #e94560;
}

.error-banner {
  background: #fff0f3;
  border: 1px solid #e94560;
  color: #e94560;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.success-banner {
  background: #f0fff4;
  border: 1px solid #2e7d32;
  color: #2e7d32;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.saving-banner {
  background: #f0f8ff;
  border: 1px solid #0ea5e9;
  color: #0369a1;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.loading-msg {
  text-align: center;
  color: #888;
  padding: 3rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #888;
}

.empty-state p { margin: 0.25rem 0; }

.hint {
  font-size: 0.875rem;
  color: #aaa;
}

/* ── Slots ────────────────────────────────── */
.slots {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.drag-hint {
  font-size: 0.8rem;
  color: #aaa;
  margin: 0 0 0.25rem 0;
  text-align: center;
}

.slot {
  border-radius: 10px;
  border: 2px dashed #e0e0e0;
  padding: 0.75rem;
  transition: border-color 0.15s, background 0.15s;
}

.slot--occupied {
  border-style: solid;
  border-color: #e8e8f0;
  background: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.slot--empty {
  background: #fafafa;
  opacity: 0.6;
}

.slot--drop-target {
  border-color: #1a1a2e;
  background: #f0f0f8;
}

.slot-label {
  margin-bottom: 0.5rem;
}

.priority-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.priority--1 { background: #fff3cd; color: #856404; }
.priority--2 { background: #d1ecf1; color: #0c5460; }
.priority--3 { background: #ede9fe; color: #5b21b6; }

/* ── Vote card ────────────────────────────── */
.vote-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem;
  border-radius: 6px;
  transition: opacity 0.15s;
}

.vote-card[draggable="true"] {
  cursor: grab;
}

.vote-card[draggable="true"]:active {
  cursor: grabbing;
}

.vote-card--dragging {
  opacity: 0.35;
}

.drag-handle {
  color: #ccc;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.vote-card:hover .drag-handle {
  color: #888;
}

.vote-info {
  flex: 1;
  min-width: 0;
}

.project-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.project-title {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mandatory-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #e94560;
  color: white;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
}

.professor-name {
  font-size: 0.82rem;
  color: #888;
  font-style: italic;
}

/* ── Empty slot ───────────────────────────── */
.slot-empty {
  padding: 0.4rem 0.25rem;
  color: #bbb;
  font-size: 0.9rem;
}

/* ── Buttons ──────────────────────────────── */
.btn {
  padding: 5px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete {
  background: #e94560;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  opacity: 0.85;
}

/* ── Info box ─────────────────────────────── */
.info-box {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.875rem 1rem;
  border: 1px solid #e0e0e0;
}

.info-box p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
}
</style>
