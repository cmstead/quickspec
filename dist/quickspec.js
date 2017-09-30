var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (moduleFactory) {
    var isNode = (typeof module === 'undefined' ? 'undefined' : _typeof(module)) !== undefined && _typeof(module.exports) !== undefined;

    if (isNode) {
        module.exports = moduleFactory();
    } else if ((typeof signet === 'undefined' ? 'undefined' : _typeof(signet)) === 'object') {
        window.quickspecFactory = moduleFactory();
    } else {
        throw new Error('The module quickspec requires Signet to run.');
    }
})(function () {
    'use strict';

    return function buildQuickspec(options) {

        var defaultOptions = {
            verbose: true
        };

        var optionsExist = (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options !== null;
        var testOptions = optionsExist ? options : defaultOptions;

        var verboseLogging = Boolean(testOptions.verbose);

        function getSpecName(specRecord) {
            return typeof specRecord.name === 'string' ? specRecord.name : 'unnamed';
        }

        function buildFailureMessage(specRecord, expectedResult, actualResult) {
            return 'Test \'' + getSpecName(specRecord) + '\' failure in spec: \n' + JSON.stringify(specRecord.setupValues, null, 4) + '\n\n' + 'Expected result to be ' + expectedResult + ', but got ' + actualResult;
        }

        function logStatus(status, message) {
            if (verboseLogging) {
                console.log('\t[quickspec:' + status + '] -- ' + message);
            }
        }

        function compareObjects(expectedResult, actualResult) {
            var objectsOk = actualResult !== null && (typeof expectedResult === 'undefined' ? 'undefined' : _typeof(expectedResult)) === (typeof actualResult === 'undefined' ? 'undefined' : _typeof(actualResult));

            var expectedKeys = Object.keys(expectedResult);
            var actualKeys = Object.keys(actualResult);

            objectsOk = objectsOk && expectedKeys.length === actualKeys.length;

            return expectedKeys.reduce(function (result, key) {
                return objectsOk && compareResults(expectedResult[key], actualResult[key]);
            }, objectsOk);
        }

        function compareResults(expectedResult, actualResult) {
            return (typeof expectedResult === 'undefined' ? 'undefined' : _typeof(expectedResult)) !== 'object' || expectedResult === null ? expectedResult === actualResult : compareObjects(expectedResult, actualResult);
        }

        function logResultStatus(specRecord, testResultOk) {
            var status = testResultOk ? 'success' : 'failure';
            var message = testResultOk ? 'Finished running \'' + getSpecName(specRecord) + '\' successfully' : 'Failed spec: ' + getSpecName(specRecord);

            logStatus(status, message);
        }

        function throwOnFailure(testResultOk, specRecord, expectedResult, actualResult) {
            if (!testResultOk) {
                throw new Error(buildFailureMessage(specRecord, expectedResult, actualResult));
            }
        }

        var throwOnFailureBuilder = function throwOnFailureBuilder(specRecord, theorem) {
            return function (actualResult) {
                var expectedResult = theorem(specRecord.setupValues);
                var testResultOk = compareResults(expectedResult, actualResult);

                logResultStatus(specRecord, testResultOk);
                throwOnFailure(testResultOk, specRecord, expectedResult, actualResult);
            };
        };

        var always = function always(value) {
            return function () {
                return value;
            };
        };

        function runVerification(testRunner, specSet, theorem) {
            specSet.forEach(function (specRecord) {
                var localTheorem = typeof theorem === 'function' ? theorem : always(specRecord.expectedResult);
                var resolveTestResult = throwOnFailureBuilder(specRecord, localTheorem);

                testRunner(specRecord.setupValues, resolveTestResult);
            });
        }

        var verifyWithTheorem = function verifyWithTheorem(testRunner) {
            return function (theorem) {
                return {
                    over: function over(specSet) {
                        return runVerification(testRunner, specSet, theorem);
                    }
                };
            };
        };

        function verify(testRunner) {

            var nextActions = verifyWithTheorem(testRunner)(null);
            nextActions.withTheorem = verifyWithTheorem(testRunner);

            return nextActions;
        }

        return {
            verify: verify
        };
    };
});