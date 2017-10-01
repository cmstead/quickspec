(function (moduleFactory) {
    let isNode = typeof module !== undefined && typeof module.exports !== undefined

    if (isNode) {
        module.exports = moduleFactory();
    } else if (typeof signet === 'object') {
        window.quickspecFactory = moduleFactory();
    } else {
        throw new Error('The module quickspec requires Signet to run.');
    }

})(function () {
    'use strict';

    return function buildQuickspec(options) {

        const defaultOptions = {
            verbose: true
        };

        const optionsExist = typeof options === 'object' && options !== null;
        const testOptions = optionsExist ? options : defaultOptions;

        const verboseLogging = Boolean(testOptions.verbose);

        function getSpecName(specRecord) {
            return typeof specRecord.name === 'string' ? specRecord.name : 'unnamed';
        }

        function buildFailureMessage(specRecord, expectedResult, actualResult) {
            const expectedOutput = specRecord.expectedResult
            const message = 'Test \'' + getSpecName(specRecord) + '\' failure in spec: \n' +
                JSON.stringify(specRecord.setupValues, null, 4) + '\n\n';

            return message +
                (typeof expectedOutput === 'undefined'
                    ? 'Theorem failed, got result: ' + actualResult
                    : 'Expected result to be ' + expectedOutput + ', but got ' + actualResult);
        }

        function logStatus(status, message) {
            if (verboseLogging) {
                console.log(`\t[quickspec:${status}] -- ${message}`);
            }
        }

        function compareObjects(expectedResult, actualResult) {
            let objectsOk = actualResult !== null
                && typeof expectedResult === typeof actualResult;

            const expectedKeys = Object.keys(expectedResult);
            const actualKeys = Object.keys(actualResult);

            objectsOk = objectsOk && expectedKeys.length === actualKeys.length;

            return expectedKeys.reduce(function (result, key) {
                return objectsOk && compareValues(expectedResult[key], actualResult[key]);
            }, objectsOk);
        }

        function compareValues(expectedResult, actualResult) {
            return typeof expectedResult !== 'object' || expectedResult === null
                ? expectedResult === actualResult
                : compareObjects(expectedResult, actualResult);
        }

        function logResultStatus(testResultOk, specRecord) {
            const status = testResultOk ? 'success' : 'failure';
            const message = testResultOk
                ? `Finished running '${getSpecName(specRecord)}' successfully`
                : `Failed spec: ${getSpecName(specRecord)}`;

            logStatus(status, message);
        }

        function throwOnFailure(testResultOk, specRecord, expectedResult, actualResult) {
            if (!testResultOk) {
                throw new Error(buildFailureMessage(specRecord, expectedResult, actualResult));
            }
        }

        const resolveTestResult = (specRecord, theorem, actualResult) => {
            const testResultOk = theorem(specRecord.setupValues, actualResult);

            logResultStatus(testResultOk, specRecord);
            throwOnFailure(testResultOk, specRecord, null, actualResult);
        }

        const equals = (a) => (_, b) => compareValues(a, b);
        const first = (values) => values[0];
        const rest = (values) => values.slice(1);

        const runAsyncVerification = (done) => (testRunner, specSet, theorem) => {
            (function verifyAndRecur(specRecord, remainingSpecs) {
                const localTheorem = typeof theorem === 'function' ? theorem : equals(specRecord.expectedResult);

                function nextOrComplete(actualResult) {
                    resolveTestResult(specRecord, localTheorem, actualResult);

                    if (remainingSpecs.length > 0) {
                        verifyAndRecur(first(remainingSpecs), rest(remainingSpecs));
                    } else {
                        done();
                    }
                }

                testRunner(specRecord.setupValues, nextOrComplete);
            })(first(specSet), rest(specSet));
        }

        const buildVerifier = (done) => (testRunner) => (theorem) => {
            return {
                over: (specSet) => runAsyncVerification(done)(testRunner, specSet, theorem)
            }
        }

        function noop() { }

        function verify(testRunner) {

            const nextActions = buildVerifier(noop)(testRunner)(null);
            nextActions.withTheorem = buildVerifier(noop)(testRunner);

            return nextActions;
        }

        function asyncVerify(done) {
            function verify(testRunner) {
                const nextActions = buildVerifier(done)(testRunner)(null);
                nextActions.withTheorem = buildVerifier(done)(testRunner);

                return nextActions;
            }

            return {
                verify: verify
            }
        }

        return {
            async: asyncVerify,
            compareValues: compareValues,
            verify: verify
        };
    }

});
