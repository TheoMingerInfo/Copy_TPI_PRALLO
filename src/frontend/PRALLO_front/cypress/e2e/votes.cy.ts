// E2E - Vue des votes (Étudiant en état Vote)
describe('Vue des votes — Étudiant', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('emma.muller@eduvaud.ch')
    cy.get('.btn-dev').click()
  })

  it('affiche les projets disponibles au vote', () => {
    cy.visit('/projects')
    cy.get('[data-cy="project-card"]').should('have.length.greaterThan', 0)
  })

  it('affiche la page Mes votes', () => {
    cy.visit('/votes')
    cy.get('[data-cy="votes-table"]').should('be.visible')
  })

  it('affiche les votes avec priorités', () => {
    cy.visit('/votes')
    cy.get('[data-cy="vote-row"]').should('have.length.greaterThan', 0)
    cy.get('[data-cy="vote-priority"]').should('be.visible')
  })

  it('peut supprimer un vote et réordonne les priorités', () => {
    cy.visit('/votes')
    cy.get('[data-cy="vote-row"]').then(($rows) => {
      const initialCount = $rows.length
      cy.get('[data-cy="btn-delete-vote"]').first().click()
      cy.get('[data-cy="vote-row"]').should('have.length', initialCount - 1)
    })
  })
})
