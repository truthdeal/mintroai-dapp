# language: en
Feature: Wallet Connection Error Handling
  As a user
  I want clear error messages when wallet connection fails
  So that I know what went wrong

  Background:
    Given I am on the homepage
    And the wallet selection modal is open

  @error-handling @skip
  Scenario: Connection rejected by user
    Given I am on the "Popular" tab
    When I click on the "MetaMask" option
    And the user rejects the connection
    Then I should see an error message
    And I should see a "Retry" button

  @error-handling @skip
  Scenario: Generic connection error
    Given I am on the "Popular" tab
    When I click on the "MetaMask" option
    And a connection error occurs
    Then I should see an error message
    And I should see a "Retry" button