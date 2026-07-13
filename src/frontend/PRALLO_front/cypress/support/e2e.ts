Cypress.Commands.add("loginDev", (email: string) => {
  cy.visit("/login")
  cy.get(".dev-select").select(email)
  cy.get(".btn-dev").click()
  cy.url().should("not.include", "/login")
})

Cypress.Commands.add("loginAsDoyen", () => {
  cy.loginDev("alice.doyen@eduvaud.ch")
})

Cypress.Commands.add("loginAsProfesseur", () => {
  cy.loginDev("bob.martin@eduvaud.ch")
})

Cypress.Commands.add("loginAsEtudiant", () => {
  cy.loginDev("emma.muller@eduvaud.ch")
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginDev(email: string): Chainable<void>
      loginAsDoyen(): Chainable<void>
      loginAsProfesseur(): Chainable<void>
      loginAsEtudiant(): Chainable<void>
    }
  }
}
