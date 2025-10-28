// Comprehensive test for English Composition Correction System
const API_ENDPOINT = 'http://localhost:8787/';

const testCases = [
    {
        name: "Basic Subject-Verb Agreement",
        input: "I are a student",
        expectedCorrections: ["I am"],
        description: "Test basic subject-verb agreement error"
    },
    {
        name: "Contraction Errors",
        input: "He dont like apples",
        expectedCorrections: ["doesn't"],
        description: "Test contraction and verb form errors"
    },
    {
        name: "Complex Sentence",
        input: "Yesterday I go to the store and buy some breads",
        expectedCorrections: ["went", "bread"],
        description: "Test tense and countable/uncountable noun errors"
    },
    {
        name: "Already Correct Text",
        input: "I am a student. He doesn't like apples.",
        expectedCorrections: [],
        description: "Test that correct text is not modified"
    }
];

async function runTests() {
    console.log('🧪 English Composition Correction System - Comprehensive Test\n');

    let passedTests = 0;
    let totalTests = testCases.length;

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n--- Test ${i + 1}/${totalTests}: ${test.name} ---`);
        console.log(`Description: ${test.description}`);
        console.log(`Input: "${test.input}"`);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: test.input })
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Corrected: "${result.corrected}"`);
            console.log(`Explanation: ${result.explanation}`);

            // Check if expected corrections are present
            let allExpectedFound = true;
            for (const expected of test.expectedCorrections) {
                if (!result.corrected.includes(expected)) {
                    allExpectedFound = false;
                    console.log(`❌ Missing expected correction: "${expected}"`);
                }
            }

            if (allExpectedFound && test.expectedCorrections.length === 0) {
                // Test for unchanged text
                if (result.corrected === test.input) {
                    console.log('✅ Correct text preserved as expected');
                    passedTests++;
                } else {
                    console.log('❌ Correct text was unexpectedly modified');
                }
            } else if (allExpectedFound) {
                console.log('✅ All expected corrections found');
                passedTests++;
            } else {
                console.log('❌ Some expected corrections missing');
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    console.log(`\n=== Test Summary ===`);
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! The English Composition Correction System is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please review the system implementation.');
    }

    return passedTests === totalTests;
}

// Run the tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});