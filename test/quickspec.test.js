'use strict';

const assert = require('chai').assert;

const quickspec = require('../index.js')({
    verbose: false
});

describe('quickspec', function () {

    describe('Pure test behaviors', function () {

        // This add is supposed to misbehave
        const add = (a) => (b) => {
            b = typeof b === 'number' ? b : 0;
            return a + b;
        }

        function executeAdd({ value1, value2 }, verify) {
            verify(add(value1)(value2));
        }

        function addTheorem({ value1, value2 }, actualResult) {
            return actualResult === (value1 + value2);
        }

        function copyObject(obj) {
            const valueIsArray = Object.prototype.toString.call(obj) === '[object Array]';
            let result = valueIsArray ? [] : {};

            return Object.keys(obj).reduce(function (result, key) {
                result[key] = copyValue(obj[key]);
                return result;
            }, result);
        }

        function copyValue(value) {
            return typeof value === 'object' && value !== null
                ? copyObject(value)
                : value;
        }

        function executeIdentity({ value }, verify) {
            const maybeBadValue = Object.keys(value).length === 0 ? { 'test': 'test' } : value;
            verify(maybeBadValue);
        }

        it('should verify all records in spec array including expected result and failure', function () {
            const specSet = [
                {
                    name: 'additive identity',
                    setupValues: { value1: 1, value2: 0 },
                    expectedResult: 1
                },
                {
                    name: 'add two numbers',
                    setupValues: { value1: 1, value2: 2 },
                    expectedResult: 3
                },
                {
                    name: 'incorrect value causes test failure',
                    setupValues: { value1: 1, value2: 0 },
                    expectedResult: 4
                }
            ];

            var message = 'Test \'incorrect value causes test failure\' failure in spec: \n' +
                JSON.stringify(specSet[2].setupValues, null, 4) + '\n\n' +
                'Expected result to be 4, but got 1';

            var runSpec = () => quickspec.verify(executeAdd).over(specSet);
            assert.throws(runSpec, message);
        });

        it('should verify all records with a theorem and throw on failure', function () {

            const specSet = [
                {
                    name: 'additive identity',
                    setupValues: { value1: 1, value2: 0 }
                },
                {
                    name: 'add two numbers',
                    setupValues: { value1: 1, value2: 2 }
                },
                {
                    name: 'incorrect value causes test failure',
                    setupValues: { value1: 1, value2: 'foo' }
                }
            ];

            var message = 'Test \'incorrect value causes test failure\' failure in spec: \n' +
                JSON.stringify(specSet[2].setupValues, null, 4) + '\n\n' +
                'Theorem failed, got result: 1';

            function runSpec() {
                quickspec
                    .verify(executeAdd)
                    .withTheorem(addTheorem)
                    .over(specSet);
            }
            assert.throws(runSpec, message);

        });

        it('should compare object values instead of pointers', function () {

            const specSet = [
                {
                    name: 'Example object',
                    setupValues: {
                        value: {
                            foo: 'bar',
                            baz: 'quux',
                            'test': {
                                'something': 'else'
                            }
                        }
                    }
                },
                {
                    name: 'Empty object',
                    setupValues: {
                        value: {}
                    },
                }
            ]

            var message = 'Test \'Empty object\' failure in spec: \n';

            const comparisonTheorem = (setupValues, actualValue) =>
                quickspec.compareValues(actualValue, copyValue(setupValues.value));

            function runSpec() {
                quickspec
                    .verify(executeIdentity)
                    .withTheorem(comparisonTheorem)
                    .over(specSet);
            }
            assert.throws(runSpec, message);

        });

    });

    describe('Async test behaviors', function () {

        function asyncAdd(a, b, callback) {
            setTimeout(function () {
                callback(null, a + b);
            }, 5);
        }

        it('should support async tests', function (done) {

            const verifyAsyncAdd = ({ value1, value2 }, verify) => {
                const verifyOnDone = (error, result) => verify(result);
                asyncAdd(value1, value2, verifyOnDone);
            };

            const specSet = [
                {
                    name: 'additive identity',
                    setupValues: { value1: 1, value2: 0 },
                    expectedResult: 1
                },
                {
                    name: 'add two numbers',
                    setupValues: { value1: 1, value2: 2 },
                    expectedResult: 3
                }
            ];

            quickspec
                .async(done)
                .verify(verifyAsyncAdd)
                .over(specSet);
        });

        it('should support async tests with theorem', function (done) {

            function verifyAsyncAdd ({ value1, value2 }, verify) {
                const verifyOnDone = (error, result) => verify(result);
                asyncAdd(value1, value2, verifyOnDone);
            };

            function addTheorem({ value1, value2 }, actualResult) {
                return (value1 + value2) === actualResult;
            }

            const specSet = [
                {
                    name: 'additive identity',
                    setupValues: { value1: 1, value2: 0 }
                },
                {
                    name: 'add two numbers',
                    setupValues: { value1: 1, value2: 2 }
                },
                {
                    name: 'add a positive and negative number',
                    setupValues: { value1: 3, value2: -7 }
                }
            ];

            quickspec
                .async(done)
                .verify(verifyAsyncAdd)
                .withTheorem(addTheorem)
                .over(specSet);
        });
    });


});

