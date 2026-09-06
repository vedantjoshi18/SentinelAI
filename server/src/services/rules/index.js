const sqlRules = require('./sqlRules');
const xssRules = require('./xssRules');
const pathTraversalRules = require('./pathTraversalRules');
const commandInjectionRules = require('./commandInjectionRules');

const allRules = [
  ...sqlRules,
  ...xssRules,
  ...pathTraversalRules,
  ...commandInjectionRules,
];

module.exports = {
  allRules,
  sqlRules,
  xssRules,
  pathTraversalRules,
  commandInjectionRules,
};