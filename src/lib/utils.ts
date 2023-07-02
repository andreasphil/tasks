/* -------------------------------------------------- *
 * Types                                              *
 * -------------------------------------------------- */

/** Recursively makes all properties in T readonly. */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

/** Recursively makes all properties in T writable. */
export type DeepWritable<T> = {
  -readonly [K in keyof T]: DeepWritable<T[K]>;
};
