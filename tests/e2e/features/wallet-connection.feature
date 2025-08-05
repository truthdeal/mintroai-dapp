# language: en
Feature: Wallet Selection Dropdown
  As a user
  I want to see different wallet options in a dropdown menu
  So that I can connect my preferred wallet easily

  Background:
    Given I am on the homepage

  @basic-display
  Scenario: Opening wallet selection dropdown
    When I click the "Connect Wallet" button
    Then I should see the wallet selection dropdown
    And I should see both EVM and NEAR wallet options