/**
 * Error type and its arguments
 */
export type ValidationError = [ValidationErrorType, ...string[]];

export class ValidationErrors {
    constructor(public errors: string | ValidationError[]) {
    }

    *toStrings(): Iterable<string> {
        if (typeof this.errors === 'string') {
            yield this.errors;
            return;
        }
        for (const [errorType, ...args] of this.errors) {
            switch (errorType) {
                case 'MISSING_COLUMN':
                    yield `Missing column ${args[0]}`;
                    break;

                case 'UNKNOWN_COLUMN':
                    yield `Unknown column ${args[0]}`;
                    break;

                default:
                    throw new Error(`Unknown error type ${errorType}`);
            }
        }
    }
}

export type ValidationErrorType = 'UNKNOWN_COLUMN' | 'MISSING_COLUMN';
