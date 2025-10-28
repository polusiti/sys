// Debug the regex patterns from the LanguageTool API

const PATTERNS = [
  // 英作文特化：基本文法
  { pattern: /\b(I)\s+(are)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },
  { pattern: /\b(he|she|it)\s+(are)\b/gi, replacement: '$1 is', explanation: 'Subject-verb agreement: use "is" with he/she/it' },
  { pattern: /\b(they|we|you)\s+(is)\b/gi, replacement: '$1 are', explanation: 'Subject-verb agreement: use "are" with they/we/you' },
  { pattern: /\b(I)\s+(is)\b/g, replacement: '$1 am', explanation: 'Subject-verb agreement: use "am" with I' },

  // 一般的な短縮形の誤り
  { pattern: /\bdont\b/gi, replacement: "don't", explanation: 'Use apostrophe in contractions: "don\'t"' },
  { pattern: /\bwont\b/gi, replacement: "won't", explanation: 'Use apostrophe in contractions: "won\'t"' },
  { pattern: /\bcant\b/gi, replacement: "can't", explanation: 'Use apostrophe in contractions: "can\'t"' },
];

function testRegexPatterns(text) {
    let corrected = text;
    const explanations = [];

    console.log(`Original text: "${text}"`);

    for (const { pattern, replacement, explanation } of PATTERNS) {
        console.log(`Testing pattern: ${pattern}`);
        const isMatch = pattern.test(corrected);
        console.log(`Pattern matches: ${isMatch}`);

        if (isMatch) {
            const before = corrected;
            corrected = typeof replacement === 'function'
                ? corrected.replace(pattern, replacement)
                : corrected.replace(pattern, replacement);
            explanations.push(explanation);
            console.log(`✅ Pattern matched! Changed: "${before}" -> "${corrected}"`);
        } else {
            console.log(`❌ Pattern did not match`);
        }
        // Reset regex for next test
        pattern.lastIndex = 0;
    }

    if (explanations.length > 0) {
        return {
            corrected,
            explanation: explanations.join('; ')
        };
    }

    return null;
}

// Test cases
const testCases = [
    "I are a student",
    "He dont like apples",
    "She cant swimming",
    "They is happy"
];

console.log('=== REGEX PATTERN DEBUG ===\n');

testCases.forEach((testCase, index) => {
    console.log(`\n--- Test Case ${index + 1}: "${testCase}" ---`);
    const result = testRegexPatterns(testCase);
    if (result) {
        console.log(`Final Result: "${result.corrected}"`);
        console.log(`Explanation: ${result.explanation}`);
    } else {
        console.log('No patterns matched');
    }
});