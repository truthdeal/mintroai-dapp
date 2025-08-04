module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['tests/e2e/steps/*.steps.ts'],
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true
  }
};