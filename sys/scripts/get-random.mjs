#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subject = process.argv[2] || 'math';
const count = parseInt(process.argv[3] || '3', 10);

const file = path.join(__dirname, '..', 'data', 'questions', `${subject}.json`);
if (!fs.existsSync(file)) {
  console.error('No such subject file:', file);
  process.exit(1);
}
const questions = JSON.parse(fs.readFileSync(file, 'utf8')).filter(q => q.active !== false);
if (!questions.length) {
  console.error('No active questions');
  process.exit(1);
}
const picked = sample(questions, Math.min(count, questions.length))
  .map(q => ({
    id: q.id,
    stem: q.stem,
    question: q.question,
    choices: q.choices,
    difficulty: q.difficulty,
    topic: q.topic
  }));
console.log(JSON.stringify({
  subject,
  requested: count,
  delivered: picked.length,
  questions: picked
}, null, 2));

function sample(arr, k) {
  if (k >= arr.length) return [...arr];
  const res = [];
  const used = new Set();
  while (res.length < k) {
    const i = Math.floor(Math.random() * arr.length);
    if (!used.has(i)) { used.add(i); res.push(arr[i]); }
  }
  return res;
}
