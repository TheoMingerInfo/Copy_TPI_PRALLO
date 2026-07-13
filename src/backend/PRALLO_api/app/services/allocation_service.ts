import Allocation from '#models/allocation'
import User from '#models/user'
import Role from '#models/role'
import Vote from '#models/vote'
import Project from '#models/project'

type AllocationRow = {
  projectId: number
  studentId: number | null
  professorId: number
  isUnassigned: boolean
}

export type AllocationResult = {
  count: number
  allocations: AllocationRow[]
  warnings: string[]
}

// Coût attribué à un projet non voté — servira de seuil pour ignorer
// les affectations "forcées" par le padding de la matrice
const NO_VOTE_COST = 10

export default class AllocationService {
  /**
   * Calcule la répartition optimale.
   *
   * Phase 1 — Algorithme hongrois (O(n³)) :
   *   - Matrice de coûts élèves × slots de projets.
   *   - Coût = priorité du vote (1 < 2 < 3). Pas de vote = NO_VOTE_COST (ignoré).
   *   - Projets expansés en slots selon maxStudents.
   *   - Résultat : affectation globalement optimale selon les votes.
   *
   * Phase 2 — Projets obligatoires non pleins :
   *   - Élèves restants affectés de force. Slot vide si plus d'élèves.
   *
   * Phase 3 — Projets non-obligatoires sans élève :
   *   - Élèves encore libres distribués sur les projets vides.
   *
   * Professeurs — greedy sur les conditions :
   *   - Compétence correspondante + capacité disponible.
   *   - Préférence pour le moins chargé.
   */
  async calculate(): Promise<AllocationResult> {
    // ── Chargement des données ──────────────────────────────────────────────
    const profRoles = await Role.query().whereIn('name', ['professeur', 'doyen'])
    const professors = await User.query()
      .whereIn('role_id', profRoles.map((r) => r.id))
      .where('max_projects', '>', 0)
      .preload('skills')

    const projects = await Project.query().preload('skills')
    const votes = await Vote.query()

    const etudiantRole = await Role.findByOrFail('name', 'etudiant')
    const students = await User.query().where('role_id', etudiantRole.id)

    // ── Construction de la matrice de coûts ─────────────────────────────────
    // Chaque projet est expansé en autant de slots que maxStudents.
    // Ex : projet A (maxStudents=2) → slots [A_0, A_1]
    const slots: { projectId: number }[] = []
    for (const project of projects) {
      for (let i = 0; i < (project.maxStudents ?? 1); i++) {
        slots.push({ projectId: project.id })
      }
    }

    // Matrice carrée n×n (padded avec NO_VOTE_COST)
    const n = Math.max(students.length, slots.length)
    const matrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(NO_VOTE_COST)
    )

    // Remplir avec les priorités de vote
    for (const vote of votes) {
      const row = students.findIndex((s) => s.id === vote.studentId)
      if (row === -1) continue
      for (let j = 0; j < slots.length; j++) {
        if (slots[j].projectId === vote.projectId) {
          const priority = vote.priority as number
          if (matrix[row][j] > priority) matrix[row][j] = priority
        }
      }
    }

    // ── Phase 1 : Algorithme hongrois ────────────────────────────────────────
    const assignment = this.hungarian(matrix)

    const allocations: AllocationRow[] = []
    const professorLoad = new Map<number, number>()
    const assignedStudents = new Set<number>()
    const projectStudentCount = new Map<number, number>()

    professors.forEach((p) => professorLoad.set(p.id, 0))
    projects.forEach((p) => projectStudentCount.set(p.id, 0))

    const isProjectFull = (projectId: number): boolean => {
      const project = projects.find((p) => p.id === projectId)!
      return (projectStudentCount.get(projectId) ?? 0) >= (project.maxStudents ?? 1)
    }

    for (let i = 0; i < students.length; i++) {
      const j = assignment[i]
      // Ignorer : slot fictif (padding) ou pas de vote réel pour ce projet
      if (j >= slots.length || matrix[i][j] >= NO_VOTE_COST) continue

      const student = students[i]
      const { projectId } = slots[j]

      if (isProjectFull(projectId)) continue

      const project = projects.find((p) => p.id === projectId)!
      const professor = this.findEligibleProfessor(project, professors, professorLoad)
      if (!professor) continue

      allocations.push({ projectId, studentId: student.id, professorId: professor.id, isUnassigned: false })
      assignedStudents.add(student.id)
      projectStudentCount.set(projectId, (projectStudentCount.get(projectId) ?? 0) + 1)
      professorLoad.set(professor.id, (professorLoad.get(professor.id) ?? 0) + 1)
    }

    // ── Phase 2 : projets obligatoires non pleins ────────────────────────────
    const unassignedStudents = students.filter((s) => !assignedStudents.has(s.id))
    const mandatoryNotFull = projects.filter((p) => p.isMandatory && !isProjectFull(p.id))

    for (const project of mandatoryNotFull) {
      const spotsLeft = (project.maxStudents ?? 1) - (projectStudentCount.get(project.id) ?? 0)

      for (let i = 0; i < spotsLeft; i++) {
        const professor = this.findEligibleProfessor(project, professors, professorLoad)
        if (!professor) break

        const student = unassignedStudents.shift() ?? null
        allocations.push({
          projectId: project.id,
          studentId: student?.id ?? null,
          professorId: professor.id,
          isUnassigned: student === null,
        })

        if (student) assignedStudents.add(student.id)
        projectStudentCount.set(project.id, (projectStudentCount.get(project.id) ?? 0) + 1)
        professorLoad.set(professor.id, (professorLoad.get(professor.id) ?? 0) + 1)
      }
    }

    // ── Phase 3 : projets non-obligatoires sans aucune allocation ────────────
    const allocatedAfterPhase2 = new Set(allocations.map((a) => a.projectId))
    const nonMandatoryEmpty = projects.filter(
      (p) => !p.isMandatory && !allocatedAfterPhase2.has(p.id)
    )

    for (const project of nonMandatoryEmpty) {
      const spotsLeft = (project.maxStudents ?? 1) - (projectStudentCount.get(project.id) ?? 0)

      for (let i = 0; i < spotsLeft; i++) {
        if (unassignedStudents.length === 0) break

        const professor = this.findEligibleProfessor(project, professors, professorLoad)
        if (!professor) break

        const student = unassignedStudents.shift()!
        allocations.push({
          projectId: project.id,
          studentId: student.id,
          professorId: professor.id,
          isUnassigned: false,
        })

        assignedStudents.add(student.id)
        projectStudentCount.set(project.id, (projectStudentCount.get(project.id) ?? 0) + 1)
        professorLoad.set(professor.id, (professorLoad.get(professor.id) ?? 0) + 1)
      }
    }

    // ── Warnings ─────────────────────────────────────────────────────────────
    const allocatedProjectIds = new Set(allocations.map((a) => a.projectId))
    const warnings: string[] = []

    const unallocatedProjects = projects.filter((p) => !allocatedProjectIds.has(p.id))
    if (unallocatedProjects.length > 0) {
      const names = unallocatedProjects.map((p) => `"${p.title}"`).join(', ')
      warnings.push(
        `${unallocatedProjects.length} projet(s) sans professeur disponible : ${names}`
      )
    }

    // ── Sauvegarde ───────────────────────────────────────────────────────────
    await Allocation.query().delete()
    await Allocation.createMany(allocations)

    return { count: allocations.length, allocations, warnings }
  }

  /**
   * Algorithme hongrois classique O(n³).
   *
   * Étape 1 — Réduction par lignes :
   *   Soustraire le minimum de chaque ligne → au moins un 0 par ligne.
   *
   * Étape 2 — Réduction par colonnes :
   *   Soustraire le minimum de chaque colonne → au moins un 0 par colonne.
   *
   * Boucle jusqu'à affectation complète :
   *   Étape 3 — Chercher une affectation sur les zéros (chemins augmentants).
   *   Étape 4 — Si incomplète : trouver la couverture minimale (algorithme de König).
   *   Étape 5 — Trouver le minimum non couvert.
   *   Étape 6 — Soustraire des cellules non couvertes, ajouter aux doublement couvertes.
   *             → de nouveaux zéros apparaissent, recommencer depuis l'étape 3.
   *
   * Retourne : assignment[i] = j  →  l'étudiant i est affecté au slot j
   */
  private hungarian(cost: number[][]): number[] {
    const n = cost.length
    // Copie profonde : on va modifier la matrice sans toucher à l'original
    const m = cost.map((row) => [...row])

    // ── Étape 1 : réduction par lignes ──────────────────────────────────────
    // Pour chaque ligne, on soustrait son minimum → crée au moins un 0 par ligne
    for (let i = 0; i < n; i++) {
      const min = Math.min(...m[i])
      for (let j = 0; j < n; j++) m[i][j] -= min
    }

    // ── Étape 2 : réduction par colonnes ────────────────────────────────────
    // Pour chaque colonne, on soustrait son minimum → crée au moins un 0 par colonne
    for (let j = 0; j < n; j++) {
      const min = Math.min(...m.map((row) => row[j]))
      for (let i = 0; i < n; i++) m[i][j] -= min
    }

    const rowAssign = new Array(n).fill(-1) // rowAssign[i] = j : ligne i → colonne j
    const colAssign = new Array(n).fill(-1) // colAssign[j] = i : colonne j → ligne i

    // Affectation avec chemins augmentants (Kuhn / couplage biparti maximum).
    //
    // Un simple greedy (premier zéro libre) échoue sur les grandes matrices :
    // il peut bloquer une ligne même quand une affectation complète existe,
    // car il ne fait pas marche arrière. Le DFS ici "libère" une colonne déjà
    // prise en réaffectant récursivement son ancien propriétaire.
    //
    // Exemple qui casse le greedy mais que le DFS résout :
    //   Ligne 0 : 0 0 10  → greedy : 0→col0, 1→col1, 2 bloqué
    //   Ligne 1 : 10 0 0  → DFS   : 0→col1, 1→col2, 2→col0 ✓
    //   Ligne 2 : 0 10 10
    const tryAssign = () => {
      rowAssign.fill(-1)
      colAssign.fill(-1)

      const augment = (i: number, visited: boolean[]): boolean => {
        for (let j = 0; j < n; j++) {
          if (m[i][j] !== 0 || visited[j]) continue
          visited[j] = true
          // Si la colonne est libre ou si son propriétaire peut se déplacer
          if (colAssign[j] === -1 || augment(colAssign[j], visited)) {
            rowAssign[i] = j
            colAssign[j] = i
            return true
          }
        }
        return false
      }

      for (let i = 0; i < n; i++) {
        if (rowAssign[i] === -1) {
          augment(i, new Array(n).fill(false))
        }
      }
    }

    tryAssign()

    // ── Boucle principale : tant que l'affectation est incomplète ───────────
    while (rowAssign.some((j) => j === -1)) {
      // ── Étape 3 : couverture minimale des zéros (algorithme de König) ────
      //
      // On cherche le minimum de lignes (H ou V) qui "couvrent" tous les zéros.
      // Règle de König :
      //   - Marquer les lignes non affectées
      //   - Si une ligne marquée a un 0 dans une colonne → marquer cette colonne
      //   - Si une colonne marquée a un 0 affecté → marquer la ligne correspondante
      //   - Répéter jusqu'à stabilité
      //   - Couverture = lignes NON marquées + colonnes marquées

      const rowMarked = rowAssign.map((j) => j === -1) // lignes sans affectation
      const colMarked = new Array(n).fill(false)

      let changed = true
      while (changed) {
        changed = false
        // Marquer les colonnes qui ont un 0 dans une ligne marquée
        for (let i = 0; i < n; i++) {
          if (!rowMarked[i]) continue
          for (let j = 0; j < n; j++) {
            if (m[i][j] === 0 && !colMarked[j]) {
              colMarked[j] = true
              changed = true
            }
          }
        }
        // Marquer les lignes dont l'affectation est dans une colonne marquée
        for (let j = 0; j < n; j++) {
          if (!colMarked[j]) continue
          const i = colAssign[j]
          if (i !== -1 && !rowMarked[i]) {
            rowMarked[i] = true
            changed = true
          }
        }
      }

      // Lignes de couverture : lignes non marquées + colonnes marquées
      const lineRow = rowMarked.map((marked) => !marked)
      const lineCol = colMarked

      // ── Étape 4 : trouver le minimum parmi les cellules non couvertes ────
      let minVal = Infinity
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (!lineRow[i] && !lineCol[j]) {
            minVal = Math.min(minVal, m[i][j])
          }
        }
      }

      // ── Étape 5 : ajuster la matrice ────────────────────────────────────
      // Non couvert     → soustraire minVal  (crée de nouveaux zéros)
      // Doublement couvert → ajouter minVal  (compense pour garder les zéros existants)
      // Couvert une fois → inchangé
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (!lineRow[i] && !lineCol[j]) m[i][j] -= minVal
          if (lineRow[i] && lineCol[j]) m[i][j] += minVal
        }
      }

      // Ré-essayer l'affectation sur les nouveaux zéros apparus
      tryAssign()
    }

    return rowAssign
  }

  /**
   * Trouve le professeur le plus adapté pour un projet.
   * Conditions : compétence correspondante + capacité disponible.
   * Préférence : le moins chargé en premier.
   */
  private findEligibleProfessor(
    project: Project,
    professors: User[],
    load: Map<number, number>
  ): User | undefined {
    const projectSkillIds = project.skills.map((s) => s.id)
    return professors
      .filter((p) => {
        const hasCapacity = (load.get(p.id) ?? 0) < (p.maxProjects ?? 0)
        const hasMatchingSkill = p.skills.some((s) => projectSkillIds.includes(s.id))
        return hasCapacity && hasMatchingSkill
      })
      .sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0))[0]
  }
}
