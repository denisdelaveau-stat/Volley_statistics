// Loads classic browser scripts (which attach their API to `window`) into an isolated context for unit tests.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function loadBrowserScripts(...files) {
  const context = vm.createContext({ console });
  context.window = context;
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

// Reads a JSON fixture from the repository.
function fixture(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

// Converts values created inside the vm context into plain objects of this realm, so that
// assert.deepStrictEqual compares structure only (prototypes differ between contexts).
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { loadBrowserScripts, fixture, plain, ROOT };
