# language: en
Feature: Wallet Selection Modal
  As a user
  I want to see different wallet options categorized by blockchain
  So that I can connect my preferred wallet easily

  Background:
    Given I am on the homepage

  @modal-display
  Scenario: Opening wallet selection modal
    When I click the "Connect Wallet" button
    Then I should see the wallet selection modal
    And I should see "Popular" tab selected by default
    And I should see "NEAR Wallet" tab
    And I should see MetaMask in the popular wallets section

  @popular-wallets
  Scenario: Viewing popular Ethereum wallets
    Given the wallet selection modal is open
    When I am on the "Popular" tab
    Then I should see the following wallet options:
      | wallet           | icon                    |
      | Rainbow         | rainbow-wallet-icon     |
      | Coinbase Wallet | coinbase-wallet-icon    |
      | MetaMask        | metamask-icon           |
      | WalletConnect   | walletconnect-icon      |
    And MetaMask should be prominently displayed
    And each wallet should have its icon and name

  @near-wallets
  Scenario: Switching to NEAR wallets tab
    Given the wallet selection modal is open
    When I click on the "NEAR Wallet" tab
    Then I should see the NEAR wallet options
    And I should see "NEAR Wallet" as the first option
    And the "Popular" tab should be unselected

  @tab-navigation
  Scenario: Tab navigation and state preservation
    Given the wallet selection modal is open
    When I click on the "NEAR Wallet" tab
    And I click on the "Popular" tab
    Then I should see the Ethereum wallet options again
    And MetaMask should still be visible

  @wallet-selection-ethereum
  Scenario: Selecting MetaMask from popular wallets
    Given the wallet selection modal is open
    And I am on the "Popular" tab
    When I click on the "MetaMask" option
    Then the MetaMask extension popup should appear
    And the modal should show a loading state

  @wallet-selection-near
  Scenario: Selecting NEAR wallet
    Given the wallet selection modal is open
    And I am on the "NEAR Wallet" tab
    When I click on the "NEAR Wallet" option
    Then I should be redirected to NEAR wallet authorization
    And the modal should show a loading state

  @modal-responsive
  Scenario: Modal responsiveness on mobile
    Given I am using a mobile device
    When I click the "Connect Wallet" button
    Then I should see the wallet selection modal in full screen
    And I should see the tabs at the top
    And all wallet options should be properly aligned

  @close-modal
  Scenario: Closing the modal
    Given the wallet selection modal is open
    When I click the close button
    Then the modal should close
    And I should see the "Connect Wallet" button again