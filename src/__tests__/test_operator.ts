import {Parameter} from "../parameter";
import {op, optional, variadic} from "../api";

const Operators = {
    add: {
        operator: op(
            {in: "number", range: 2},
            ([x, y]) => x + y),
        x: 1, y: 2 },

    filter: {
        operator: op([
            {requires: Array.isArray},
            {
                in: "function",
                requires: (f => f.length === 1)
            }],
            ([a]: any[][], [f]: ((_: any) => boolean)[]) => a.filter(f)),
        x: [1, 2, 3, 4, 5, 6, 7, 8, 9], y: (n: number) => (n & 1) == 1
    },

    map: {
        operator: op([
            {requires: Array.isArray},
            new Parameter<1, ([a]: any[][], [f]: ((_: any) => any)[]) => any>("function")],
            ([a]: any[][], [f]: ((_: any) => any)[]) => a.map(f)),
        x: [1, 3, 5, 7, 9], y: (n: number) => n << 1
    },
    nullary: {
        operator: op(Parameter.Void, () => true)
    },
    reduce: {
        operator: op([
                variadic("number"),
                new Parameter<1>({in: "function", requires: f => f.length === 2}),
                optional("number")],
            (array: number[],
             [f]:((a: number, e: number) => number)[],
             [s]: number[]) => array.reduce(f, s)),
        x: [1, 9, 25, 49, 81], y: (x, y) => x + y, z: 0
    }
}

const Outputs = {
    add: Operators.add.x + Operators.add.y,
    filter: Operators.filter.x.filter(Operators.filter.y),
    map: Operators.map.x.map(Operators.map.y),
    reduce: Operators.reduce.x.reduce(Operators.reduce.y, Operators.reduce.z)
}

const optionalsOp = op([optional(), optional()], (..._: any[]) => "PASSED-2");

describe("Operator Tests", () => {

    test(`Operator with multiple parameters including void param throws`,
        () => expect(() => op(
            [new Parameter(), {in: "number", range: 1}],
            (_: any[], __: any[]) => {})).toThrow());

    test(`Operator with expecting 2 args called with 1 throws`, () =>
        expect(() => Operators.map.operator([Operators.map.x])).toThrow());

    test(`${Operators.add.x} + ${Operators.add.y} = ${Outputs.add}`, () =>
        expect(Operators.add.operator([Operators.add.x, Operators.add.y]))
            .toBe(Outputs.add));

    test(`filter([${Operators.filter.x}], odd) = [${Outputs.filter}]`, () =>
        expect(Operators.filter.operator([Operators.filter.x], [Operators.filter.y]))
            .toStrictEqual(Outputs.filter));

    test(`map([${Operators.map.x}], square) = [${Outputs.map}]`, () =>
        expect(Operators.map.operator([Operators.map.x], [Operators.map.y]))
            .toStrictEqual(Outputs.map));

    test(`reduce([${Operators.reduce.x}], sum, ${Operators.reduce.z}) = ${Outputs.reduce}`, () =>
        expect(Operators.reduce.operator(
            ...Operators.reduce.x, Operators.reduce.y, Operators.reduce.z))
            .toStrictEqual(Outputs.reduce));

    test(`optionalsOp() === "PASSED-2"`, () =>
        expect(optionalsOp()).toStrictEqual("PASSED-2")
    );

    test(`optionalsOp(0) === "PASSED-2"`, () =>
        expect(optionalsOp([0])).toStrictEqual("PASSED-2")
    );

    test(`optionalsOp(0, 0) === "PASSED-2"`, () =>
        expect(optionalsOp(0,0)).toStrictEqual("PASSED-2")
    );

    test(`optionalsOp(0,0,0) throws exception"`, () =>
        expect(() => optionalsOp(0,0,0)).toThrow()
    );

    test(`nullaryOp() returns true`, () =>
        expect(Operators.nullary.operator()).toBe(true));

    test(`nullaryOp(arg) throws exception`, () =>
        expect(() => Operators.nullary.operator(undefined)).toThrow());
});