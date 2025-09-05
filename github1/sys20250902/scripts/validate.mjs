#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'data', 'questions');

let errors = 0;
const allIds = new Set();

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const full = path.join(dir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    console.error('Parse error:', file, e.message);
    errors++; continue;
  }
  if (!Array.isArray(data)) {
    console.error('File must contain array:', file);
    errors++; continue;
  }

  data.forEach((q, i) => {
    if (!q.id) { console.error(file, 'missing id at index', i); errors++; return; }
    if (allIds.has(q.id)) { console.error('Duplicate id:', q.id, 'in', file); errors++; }
    else allIds.add(q.id);

    const type = q.type || 'mc';

    if (type === 'mc') {
      if (!Array.isArray(q.choices) || q.choices.length < 2) {
        console.error('Invalid choices length at', q.id); errors++;
      } else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) {
        console.error('Answer out of range at', q.id); errors++;
      }
    } else if (type === 'open') {
      if ((!q.expected || typeof q.expected !== 'string') &&
          (!Array.isArray(q.accepted) || !q.accepted.length)) {
        console.error('Open question missing expected/accepted at', q.id); errors++;
      }
    } else if (type === 'rootfrac') {
      if (!q.expected || typeof q.expected !== 'object') {
        console.error('rootfrac missing expected object at', q.id); errors++; return;
      }
      const { a, b=null, c=null } = q.expected;
      if (!Number.isInteger(a)) {
        console.error('rootfrac expected.a must be integer at', q.id); errors++;
      }
      if (b !== null) {
        if (!Number.isInteger(b) || b <= 1) {
          console.error('rootfrac expected.b must be integer >1 (squarefree) at', q.id); errors++;
        } else if (!isSquareFree(b)) {
          console.error('rootfrac expected.b not squarefree at', q.id); errors++;
        }
      }
      if (c !== null) {
        if (!Number.isInteger(c) || c <= 0) {
          console.error('rootfrac expected.c must be integer >0 at', q.id); errors++;
        }
      }
      // 簡約性: gcd(a,c)=1 (c存在時)
      if (c && gcd(Math.abs(a), c) !== 1) {
        console.error('rootfrac not reduced gcd(a,c)!=1 at', q.id); errors++;
      }
      // bなしで c ありのときは (a/c) が整数化できないなら許容: ただし今回は簡潔化要求で gcd(a,c)==1 が上で保証
    } else {
      console.error('Unknown type at', q.id); errors++;
    }
  });
}

if (errors) {
  console.error(`Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('Validation OK.');
}

function gcd(a,b){ return b===0?a:gcd(b,a%b); }
function isSquareFree(n){
  for (let p=2; p*p<=n; p++){
    let c=0;
    while(n%p===0){ n/=p; c++; if(c>1) return false; }
  }
  return true;
}
