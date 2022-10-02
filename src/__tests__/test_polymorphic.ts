import {op, optional, pattern, polyop} from "../lib";

function setupF() {
    const f = polyop();

    const opt = op([optional(), optional(), optional()], (_, __, ___) => "PASSED");

    const posNumInt = op(
        [{in: "number", requires: n => n > 0}, "number"],
        (_, __) => "INTERCEPTED");

    const mulNum = op(["number", "number"], (x, y) => x[0] * y[0]);
    const rptStr = op(["string", "number"], (x, y) => x[0].repeat(y[0]));
    const rptStrr = op(["number", "string"], (x, y) => y[0].repeat(x[0]));
    const concat = op(["string", "string"], (x, y) => `${x[0]}${y[0]}`);

    f.implement(opt, mulNum, posNumInt, rptStr, rptStrr, concat);

    return f;
}

const f = setupF();

const fact = pattern(
    "number",
    [
        [{requires: n => n === 0 || n === 1}, _ => 1],
        [{}, ([n]: number[]) => n * fact([n - 1])]
    ]
)

test(`f([]) = 'PASSED-1'`, () =>
    expect(f()).toStrictEqual("PASSED"));

test(`f([], [0]) = 'PASSED-3'`, () =>
    expect(f([], [0])).toStrictEqual("PASSED"));

test(`f([], [0], [0]) = 'PASSED-3'`, () =>
    expect(f([], [0], [0])).toStrictEqual("PASSED"));

test(`f([3], [4], [], [0]) throws`,
    () => expect(() => f([3], [4], [], [0])).toThrow());

test(`f(3, 4) = INTERCEPTED`, () =>
    expect(f([3], [4])).toStrictEqual("INTERCEPTED"));

test(`f(3, 4) = -12`, () =>
    expect(f([-3], [4])).toStrictEqual(-12));

test(`f(3, "4") = "444"`, () =>
    expect(f([3], ["4"])).toStrictEqual("444"));

test(`f("3", 4) = "3333"`, () =>
    expect(f(["3"], [4])).toStrictEqual("3333"));

test(`f("3", "4") = "34"`, () =>
    expect(f(["3"], ["4"])).toStrictEqual("34"));

test(`fact([0]) = 1`, () =>
    expect(fact([0])).toStrictEqual(1));

test(`fact([1]) = 1`, () =>
    expect(fact([1])).toStrictEqual(1));

test(`fact([4]) = 24`, () =>
    expect(fact([4])).toStrictEqual(24));