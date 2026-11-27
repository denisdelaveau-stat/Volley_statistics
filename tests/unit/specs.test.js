// Specifications (docs/specs): every spec follows the template, numbers its requirements, traces each of them to a
// test or a manual check, and only cites tests that exist. The index lists every spec with its status.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'docs', 'specs');
const SECTIONS = [
  'Purpose',
  'Scope',
  'Definitions',
  'Requirements',
  'States, errors and edge cases',
  'Data',
  'Interface',
  'Accessibility and language',
  'Acceptance and traceability',
  'History',
];
const HEADER_FIELDS = ['Spec ID', 'Status', 'Version', 'Applies to', 'Last review', 'Source of truth', 'Related specs'];

const specFiles = fs
  .readdirSync(DIR)
  .filter((f) => /^(SYS|DOM|UI)-[A-Z0-9-]+\.md$/.test(f))
  .sort();

function read(file) {
  return fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
}
function section(text, number) {
  const start = text.search(new RegExp('^## ' + number + '\\. ', 'm'));
  if (start < 0) return '';
  const rest = text.slice(start + 1);
  const end = rest.search(/^## \d+\. /m);
  return end < 0 ? rest : rest.slice(0, end);
}
// Requirement IDs cited in a text: full IDs, plus short forms after a full ID in the same table cell
// ("`X-01`, `-02`" and "`X-01` to `-08`").
function citedIds(text, specId) {
  const ids = new Set();
  for (const cell of text.split('|')) {
    let last = null;
    const re = new RegExp('`(' + specId + '-(\\d{2}))`|(to )?`-(\\d{2})`', 'g');
    let m;
    while ((m = re.exec(cell))) {
      if (m[1]) {
        last = +m[2];
        ids.add(m[1]);
      } else if (last != null) {
        const n = +m[4];
        if (m[3]) for (let i = last + 1; i <= n; i++) ids.add(specId + '-' + String(i).padStart(2, '0'));
        else ids.add(specId + '-' + m[4]);
        last = n;
      }
    }
  }
  return ids;
}

test('there are specifications to check', () => {
  assert.ok(specFiles.length >= 6, specFiles.join(', '));
});

for (const file of specFiles) {
  const specId = file.replace(/\.md$/, '');
  const text = read(file);

  test(specId + ': title, header table and the ten template sections in order', () => {
    assert.match(text, new RegExp('^# ' + specId + ' — .+'), 'title "# ' + specId + ' — …"');
    for (const field of HEADER_FIELDS) assert.match(text, new RegExp('^\\| ' + field + ' \\|', 'm'), field);
    assert.match(text, /^\| Status \| (Draft|Current|Superseded) \|/m, 'status');
    let previous = -1;
    SECTIONS.forEach((title, i) => {
      const at = text.indexOf('\n## ' + (i + 1) + '. ' + title);
      assert.ok(at > previous, 'section ' + (i + 1) + '. ' + title);
      previous = at;
    });
  });

  test(specId + ': requirements are numbered once, and each one is traced in section 9', () => {
    const declared = [...section(text, 4).matchAll(/^\| `([A-Z0-9-]+-\d{2})` \|/gm)].map((m) => m[1]);
    assert.ok(declared.length > 0, 'at least one requirement');
    assert.equal(new Set(declared).size, declared.length, 'no duplicate requirement ID');
    for (const id of declared) assert.ok(id.startsWith(specId + '-'), id + ' belongs to ' + specId);
    const traced = citedIds(section(text, 9), specId);
    const missing = declared.filter((id) => !traced.has(id));
    assert.deepEqual(missing, [], 'requirements without a test or manual check');
  });

  test(specId + ': every test cited exists', () => {
    const missing = [];
    for (const m of text.matchAll(/`(tests\/[\w/.-]+\.(?:py|js))(?:::(\w+))?/g)) {
      const testFile = path.join(ROOT, m[1]);
      if (!fs.existsSync(testFile)) {
        missing.push(m[1]);
        continue;
      }
      if (m[2] && !new RegExp('def ' + m[2] + '\\(').test(fs.readFileSync(testFile, 'utf8'))) missing.push(m[0]);
    }
    for (const m of text.matchAll(/`(tests\/unit\/[\w-]+\.test\.js)` « ([^»]+?)(?:…)? »/g)) {
      const source = fs.readFileSync(path.join(ROOT, m[1]), 'utf8');
      const title = m[2].trim().replace(/…$/, '');
      if (!source.includes("test('" + title) && !source.includes('test("' + title))
        missing.push(m[1] + ' « ' + title + ' »');
    }
    assert.deepEqual(missing, []);
  });
}

test('the index lists every specification, with the status written in the file', () => {
  const index = read('README.md');
  for (const file of specFiles) {
    const specId = file.replace(/\.md$/, '');
    const status = read(file).match(/^\| Status \| (\w+) \|/m)[1];
    const row = index.match(
      new RegExp('^\\| \\[' + specId + '\\]\\(' + specId + '\\.md\\) \\| [^|]+\\| (\\w+) \\|', 'm')
    );
    assert.ok(row, specId + ' is listed in docs/specs/README.md');
    assert.equal(row[1], status, specId + ' status in the index');
  }
  for (const m of index.matchAll(/^\| \[([A-Z0-9-]+)\]\(\1\.md\) \| [^|]+\| (\w+) \|/gm))
    if (m[2] !== 'Planned') assert.ok(specFiles.includes(m[1] + '.md'), m[1] + ' is ' + m[2] + ' but has no file');
});
