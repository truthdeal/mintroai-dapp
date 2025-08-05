module.exports = {
  default: {
    paths: ['tests/e2e/features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['tests/e2e/steps/**/*.ts', 'tests/e2e/support/**/*.ts'],
    format: ['progress-bar'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
    timeout: 60000 // 60 seconds
  }
}