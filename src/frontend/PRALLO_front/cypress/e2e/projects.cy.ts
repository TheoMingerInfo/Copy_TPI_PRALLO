// E2E - Vue des projets
describe('Vue des projets', () => {
  beforeEach(() => {
    cy.loginAsDoyen()
    cy.visit('/projects')
  })

  it('affiche la liste des projets', () => {
    cy.get('[data-cy="project-card"]').should('have.length.greaterThan', 0)
  })

  it('affiche le titre, professeur et compétences de chaque projet', () => {
    cy.get('[data-cy="project-card"]').first().within(() => {
      cy.get('[data-cy="project-title"]').should('not.be.empty')
      cy.get('[data-cy="project-professor"]').should('not.be.empty')
      cy.get('[data-cy="project-skills"]').should('exist')
    })
  })

  it('ouvre le modal de détail au clic sur une carte', () => {
    cy.get('[data-cy="project-card"]').first().click()
    cy.get('[data-cy="project-modal"]').should('be.visible')
    cy.get('[data-cy="modal-close"]').click()
    cy.get('[data-cy="project-modal"]').should('not.exist')
  })

  it('permet la recherche par texte', () => {
    cy.get('[data-cy="search-input"]').type('Vue')
    cy.get('[data-cy="project-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'Vue')
    })
  })

  it('affiche le bouton créer pour le doyen', () => {
    cy.get('[data-cy="btn-create-project"]').should('be.visible')
  })

  it('ouvre le formulaire de création', () => {
    cy.get('[data-cy="btn-create-project"]').click()
    cy.get('[data-cy="project-modal"]').should('be.visible')
    cy.get('[data-cy="input-title"]').should('be.visible')
  })

  it('affiche une erreur si titre > 30 chars', () => {
    cy.get('[data-cy="btn-create-project"]').click()
    cy.get('[data-cy="input-title"]').type('Un titre vraiment bien trop long pour être accepté')
    cy.get('[data-cy="btn-save"]').click()
    cy.get('[data-cy="error-title"]').should('be.visible')
  })

  it('affiche une erreur si description > 350 chars', () => {
    cy.get('[data-cy="btn-create-project"]').click()
    cy.get('[data-cy="input-title"]').type('Titre valide')
    cy.get('[data-cy="input-description"]').type('x'.repeat(351))
    cy.get('[data-cy="btn-save"]').click()
    cy.get('[data-cy="error-description"]').should('be.visible')
  })
})
