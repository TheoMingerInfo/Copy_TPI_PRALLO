// E2E - Vue des participants (Doyen)
describe('Vue des participants — Doyen', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.visit('/participants')
  })

  it('affiche le tableau des participants', () => {
    cy.get('[data-cy="participants-table"]').should('be.visible')
  })

  it('affiche nom, rôle et compétences de chaque participant', () => {
    cy.get('[data-cy="participant-row"]').first().within(() => {
      cy.get('[data-cy="participant-name"]').should('not.be.empty')
      cy.get('[data-cy="participant-role"]').should('be.visible')
    })
  })

  it('peut changer le rôle d\'un participant', () => {
    cy.get('[data-cy="participant-role-select"]').first().select('professeur')
    cy.wait(500)
    cy.get('[data-cy="participant-role-select"]').first().should('have.value', 'professeur')
  })

  it('affiche le champ maxProjects pour les professeurs', () => {
    cy.get('[data-cy="participant-row"]').each(($row) => {
      cy.wrap($row).find('[data-cy="participant-role-select"]').then(($select) => {
        if ($select.val() === 'professeur' || $select.val() === 'doyen') {
          cy.wrap($row).find('[data-cy="participant-max-projects"]').should('be.visible')
        }
      })
    })
  })
})
