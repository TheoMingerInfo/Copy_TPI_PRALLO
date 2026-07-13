// E2E - Vue des répartitions
describe('Vue des répartitions — Doyen', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/allocations')
  })

  it('affiche la vue des répartitions', () => {
    cy.get('[data-cy="allocations-view"]').should('be.visible')
  })

  it('affiche le bouton de calcul de répartition (doyen)', () => {
    cy.get('[data-cy="btn-calculate"]').should('be.visible')
  })

  it('calcule la répartition', () => {
    cy.get('[data-cy="btn-calculate"]').click()
    cy.get('[data-cy="allocation-row"]').should('have.length.greaterThan', 0)
  })

  it('affiche projet, étudiant et professeur par ligne', () => {
    cy.get('[data-cy="btn-calculate"]').click()
    cy.get('[data-cy="allocation-row"]').first().within(() => {
      cy.get('[data-cy="allocation-project"]').should('not.be.empty')
      cy.get('[data-cy="allocation-professor"]').should('not.be.empty')
    })
  })
})

describe('Vue des répartitions — Étudiant', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('emma.muller@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/allocations')
  })

  it('affiche la répartition en lecture seule', () => {
    cy.get('[data-cy="allocations-view"]').should('be.visible')
    cy.get('[data-cy="btn-calculate"]').should('not.exist')
  })
})
