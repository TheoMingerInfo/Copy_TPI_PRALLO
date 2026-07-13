// E2E - Page de connexion
describe('Page de connexion', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('affiche le logo PRALLO', () => {
    cy.contains('PRALLO').should('be.visible')
  })

  it('affiche le bouton de connexion Microsoft', () => {
    cy.contains('Se connecter avec Eduvaud').should('be.visible')
  })

  it('affiche le bypass dev en mode développement', () => {
    // En mode dev, le bypass est visible
    cy.get('.dev-bypass').should('exist')
    cy.contains('Mode développement').should('be.visible')
  })

  it('permet la connexion via bypass dev avec rôle doyen', () => {
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.url().should('include', '/projects')
    cy.contains('Alice').should('be.visible')
  })

  it('permet la connexion via bypass dev avec rôle étudiant', () => {
    cy.get('.dev-select').select('emma.muller@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.url().should('include', '/projects')
  })

  it('redirige vers /projects après connexion', () => {
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.url().should('include', '/projects')
  })

  it('affiche une erreur si connexion échoue', () => {
    // Simuler une erreur API
    cy.intercept('POST', '/api/auth/dev-bypass', { statusCode: 404, body: { error: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' } })
    cy.get('.dev-select').select('alice.doyen@eduvaud.ch')
    cy.get('.btn-dev').click()
    cy.get('.error-msg').should('be.visible')
  })
})
