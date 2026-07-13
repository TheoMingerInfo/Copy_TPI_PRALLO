// E2E - Vue des compétences (Doyen)
describe('Vue des compétences — Doyen', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/skills')
  })

  it('affiche la liste des compétences', () => {
    cy.get('[data-cy="skill-item"]').should('have.length.greaterThan', 0)
  })

  it('affiche le formulaire d\'ajout de compétence', () => {
    cy.get('[data-cy="input-new-skill"]').should('be.visible')
  })

  it('ajoute une nouvelle compétence', () => {
    const uniqueName = `TestSkill${Date.now()}`
    cy.get('[data-cy="input-new-skill"]').type(uniqueName)
    cy.get('[data-cy="btn-add-skill"]').click()
    cy.get('[data-cy="skill-item"]').should('contain.text', uniqueName)
  })

  it('affiche une erreur si compétence en double', () => {
    cy.get('[data-cy="input-new-skill"]').type('JavaScript')
    cy.get('[data-cy="btn-add-skill"]').click()
    cy.get('[data-cy="skill-error"]').should('be.visible')
  })

  it('supprime une compétence avec confirmation', () => {
    cy.get('[data-cy="btn-delete-skill"]').first().click()
    cy.get('[data-cy="confirm-modal"]').should('be.visible')
    cy.get('[data-cy="btn-confirm"]').click()
    cy.get('[data-cy="confirm-modal"]').should('not.exist')
  })

  it('fusionne deux compétences sélectionnées', () => {
    cy.get('[data-cy="skill-checkbox"]').eq(0).check()
    cy.get('[data-cy="skill-checkbox"]').eq(1).check()
    cy.get('[data-cy="btn-merge-skills"]').should('be.visible').click()
    cy.get('[data-cy="confirm-modal"]').should('be.visible')
    cy.get('[data-cy="btn-confirm"]').click()
  })
})

// E2E - Vue des compétences (Professeur)
describe('Vue des compétences — Professeur', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('bob.martin@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/skills')
  })

  it('affiche la vue 2 colonnes (toutes / mes compétences)', () => {
    cy.get('[data-cy="all-skills-col"]').should('be.visible')
    cy.get('[data-cy="my-skills-col"]').should('be.visible')
  })

  it('peut ajouter une compétence à ses compétences', () => {
    cy.get('[data-cy="all-skills-col"] [data-cy="btn-add-to-mine"]').first().click()
    cy.get('[data-cy="my-skills-col"] [data-cy="skill-item"]').should('have.length.greaterThan', 0)
  })

  it('peut retirer une compétence de ses compétences', () => {
    cy.get('[data-cy="my-skills-col"] [data-cy="btn-remove-from-mine"]').first().click()
  })
})
