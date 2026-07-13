// E2E - Gestion de l'état (Doyen)
describe('Gestion de l\'état — Doyen', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/state')
  })

  it('affiche l\'état actuel', () => {
    cy.get('[data-cy="current-state"]').should('be.visible')
  })

  it('affiche les boutons de transition', () => {
    cy.get('[data-cy="btn-next-state"]').should('be.visible')
  })

  it('affiche les warnings avant changement d\'état', () => {
    cy.get('[data-cy="btn-next-state"]').click()
    cy.get('[data-cy="confirm-modal"]').should('be.visible')
    cy.get('[data-cy="modal-warnings"]').should('exist')
  })

  it('peut annuler le changement d\'état', () => {
    cy.get('[data-cy="btn-next-state"]').click()
    cy.get('[data-cy="confirm-modal"]').should('be.visible')
    cy.get('[data-cy="btn-cancel"]').click()
    cy.get('[data-cy="confirm-modal"]').should('not.exist')
  })

  it('peut confirmer le changement d\'état', () => {
    cy.get('[data-cy="current-state"]').then(($state) => {
      const before = $state.text()
      cy.get('[data-cy="btn-next-state"]').click()
      cy.get('[data-cy="confirm-modal"]').within(() => {
        cy.get('[data-cy="btn-confirm"]').click()
      })
      cy.get('[data-cy="current-state"]').should('not.have.text', before)
    })
  })
})
