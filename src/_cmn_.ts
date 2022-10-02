import type {Hedge, HedgeFn, Maybe, Prototype} from "./htypes";

export const at = <T>(array: T[], index: number): Maybe<T> =>
    index < 0 ? array[index + array.length] : array[index];

export const capitalize = (str: string): string =>
    str.length === 0 ? "" : str.length === 1
        ? str.toUpperCase()
        : `${str[0].toUpperCase()}${str.substring(1)}`;

export const has = <T>(array: T[], obj: T) => array.findIndex(e => e === obj) >= 0;

export const invalid = (name: string, invalid: any): Error =>
    new Error(`Invalid ${name}: ${invalid}`);

export const isempty = (obj: object | any[]) =>
    (Array.isArray(obj) ? obj : Object.keys(obj)).length === 0;

export const issimilar = <T extends T[] | {[key: string]: any}>(obj1: T, obj2: T) => {
    if (Array.isArray(obj1)) {
        return obj1.length === obj2.length
            && (isempty(obj1) || obj1.every(e => has(obj2 as T[], e)));
    }

    const [keys1, keys2] = [Object.keys(obj1), Object.keys(obj2)];

    if (keys1.length !== keys2.length)
        return false;

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    if (allKeys.size !== keys1.length)
        return false;

    return [...allKeys].every(key => obj1[key] === obj2[key])
};

export const nameof = (type: Prototype) => typeof type === "string" ? type : type.name;

export const prototypeof = (obj: any) => Object.getPrototypeOf(obj);

export const stringify = (...args: any[]): string =>`[${
    args.map(arg => Array.isArray(arg)
        ? `[${arg.map(sarg => stringify(sarg)).join(',')}]`
        : arg.toString())}]`;

export const wrap = <T>(obj: T | T[]) =>
    Array.isArray(obj) ? obj : [obj];