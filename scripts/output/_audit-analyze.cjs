const fs = require('fs');
const h = JSON.parse(fs.readFileSync(__dirname + '/audit-hyper.json'));
const u = JSON.parse(fs.readFileSync(__dirname + '/audit-upgrade.json'));
const c = JSON.parse(fs.readFileSync(__dirname + '/audit-cannot.json'));

const ur = {};
u.forEach(m => {
  const r = m.reason;
  if (!ur[r]) ur[r] = [];
  ur[r].push(m.id);
});

const cr = {};
c.forEach(m => {
  const r = m.reason;
  if (!cr[r]) cr[r] = [];
  cr[r].push(m.id);
});

console.log('HYPER_COUNT:' + h.length);
Object.keys(ur).forEach(k => console.log('UPGRADE|' + k + '|' + ur[k].length));
Object.keys(cr).forEach(k => console.log('CANNOT|' + k + '|' + cr[k].length));

// Write ID lists
fs.writeFileSync(__dirname + '/audit-ids-hyper.txt', h.map(m => m.id).join('\n'));

Object.keys(ur).forEach((k, i) => {
  fs.writeFileSync(__dirname + '/audit-ids-upgrade-' + i + '.txt', k + '\n---\n' + ur[k].join('\n'));
});

Object.keys(cr).forEach((k, i) => {
  fs.writeFileSync(__dirname + '/audit-ids-cannot-' + i + '.txt', k + '\n---\n' + cr[k].join('\n'));
});

// Lat precision analysis for hyper group
function decP(n) {
  const s = String(n);
  return s.includes('.') ? s.split('.')[1].replace(/0+$/, '').length : 0;
}

let precLow = 0, precMed = 0, precHigh = 0;
h.forEach(m => {
  const p = Math.max(decP(m.lat), decP(m.lng));
  if (p >= 5) precHigh++;
  else if (p >= 4) precMed++;
  else precLow++;
});
console.log('HYPER_PRECISION|<4dec:' + precLow + '|4dec:' + precMed + '|5+dec:' + precHigh);
