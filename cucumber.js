module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'tests/e2e/steps/*.steps.ts',
      'tests/e2e/support/*.ts'
    ],
    paths: ['tests/e2e/features/*.feature'],
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    timeout: 30000 // 30 saniye
  }
};