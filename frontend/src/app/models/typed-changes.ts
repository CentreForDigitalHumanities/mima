import { SimpleChange, SimpleChanges } from "@angular/core";

/**
 * Typed version of @see {@link SimpleChanges}
 */
export declare type TypedChanges<T> = {
    [K in keyof T]: SimpleChange
};
