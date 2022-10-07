import {Parameter} from "../parameter";
import {isclosed, isdegenerate, isnatural, isopen, isvoid, variadic} from "../api";

class Parent { }

class Child extends Parent { }

const parentObject = new Parent();
const childObject = new Child();

const Parameters = {
    atMost3Parameter: new Parameter({in: "object", range: [0, 3]}),
    exactly2Parameter: new Parameter({in: "object", range: 2}),
    falseParameter: new Parameter({in: "object", requires: [0, "f", "false", "False"]}),
    naturalParameter: new Parameter({in: "number", requires: isnatural()}),
    numberOrStringParameter: new Parameter({in: ["number", "string"]}),
    numberParameter: new Parameter({in: "number"}),
    oneOrMoreParameter: new Parameter({in: "object", range: [1, -1]}),
    optionalParameter: new Parameter({in: "object", range: [0, 1]}),
    parentSubtypeParameter: new Parameter({in: Parent}),
    parentParameter: new Parameter({in: "Parent!"}),
    childOnlyParameter: new Parameter({in: "Parent:"}),
    variadicParameter: variadic(),
    voidParameter: new Parameter()
};

describe("Parameter", () => {

    test("void param is void",
        () => expect(isvoid(Parameters.voidParameter)).toBe(true));

    test("void param is degenerate",
        () => expect(isdegenerate(Parameters.voidParameter)).toBe(true));

    test("void param is not open",
        () => expect(isopen(Parameters.voidParameter)).toBe(false));

    test("void param is not closed",
        () => expect(isclosed(Parameters.voidParameter)).toBe(false));

    test("variadic param is not void",
        () => expect(isvoid(Parameters.variadicParameter)).toBe(false));

    test("variadic param is not degenerate",
        () => expect(isdegenerate(Parameters.variadicParameter)).toBe(false));

    test("variadic param is open",
        () => expect(isopen(Parameters.variadicParameter)).toBe(true));

    test("variadic param is not closed",
        () => expect(isclosed(Parameters.variadicParameter)).toBe(false));

    test("degenerate param is not void",
        () => expect(isvoid(Parameters.exactly2Parameter)).toBe(false));

    test("degenerate param is degenerate",
        () => expect(isdegenerate(Parameters.exactly2Parameter)).toBe(true));

    test("degenerate param is not open",
        () => expect(isopen(Parameters.exactly2Parameter)).toBe(false));

    test("degenerate param is not closed",
        () => expect(isclosed(Parameters.exactly2Parameter)).toBe(false));

    test("closed param is not void",
        () => expect(isvoid(Parameters.atMost3Parameter)).toBe(false));

    test("closed param is not degenerate",
        () => expect(isdegenerate(Parameters.atMost3Parameter)).toBe(false));

    test("closed param is not open",
        () => expect(isopen(Parameters.atMost3Parameter)).toBe(false));

    test("closed param is closed",
        () => expect(isclosed(Parameters.atMost3Parameter)).toBe(true));

    test("number param accepts number argument",
        () => expect(Parameters.numberParameter.accepts(1)).toBe(true));

    test("number param does not accept string argument",
        () => expect(Parameters.numberParameter.accepts("string")).toBe(false));

    test("number | string param accepts number argument",
        () => expect(Parameters.numberOrStringParameter.accepts(1)).toBe(true));

    test("number | string param accepts string argument",
        () => expect(Parameters.numberOrStringParameter.accepts("string")).toBe(true));

    test("parent param does accept parent",
        () => expect(Parameters.parentParameter.accepts(parentObject)).toBe(true));

    test("parent param does not accept child",
        () => expect(Parameters.parentParameter.accepts(childObject)).toBe(false));

    test("parent with subtypes param does accept parent",
        () => expect(Parameters.parentSubtypeParameter.accepts(parentObject)).toBe(true));

    test("parent with subtypes param does accept child",
        () => expect(Parameters.parentSubtypeParameter.accepts(childObject)).toBe(true));

    test("parent with subtypes only param does not accept parent",
        () => expect(Parameters.childOnlyParameter.accepts(parentObject)).toBe(false));

    test("parent with subtypes only param does accept child",
        () => expect(Parameters.childOnlyParameter.accepts(childObject)).toBe(true));

    test("natural parameter does not accept negative number",
        () => expect(Parameters.naturalParameter.accepts(-1)).toBe(false));

    test("natural parameter accepts positive number",
        () => expect(Parameters.naturalParameter.accepts(1)).toBe(true));

    test("falsy parameter does not accept missing value",
        () => expect(Parameters.falseParameter.accepts("true")).toBe(false));

    test("falsy param does accept falsy values",
        () => expect(Parameters.falseParameter.accepts("false")).toBe(true));

    test("void param accepts no argument",
        () => expect(Parameters.optionalParameter.accepts([])).toBe(true));
    
    test("void param does not accept argument",
        () => expect(Parameters.voidParameter.accepts(1)).toBe(false));
    
    test("variadic param accepts no arguments",
        () => expect(Parameters.variadicParameter.accepts([])).toBe(true));
    
    test("variadic param accepts one argument",
        () => expect(Parameters.variadicParameter.accepts(1)).toBe(true));

    test("variadic param accepts list of arguments",
        () => expect(Parameters.variadicParameter.accepts([1, 2, 3, 4, 5, 6])).toBe(true));

    test("optional param accepts no argument",
        () => expect(Parameters.optionalParameter.accepts([])).toBe(true));
    
    test("optional param accepts one argument",
        () => expect(Parameters.optionalParameter.accepts(1)).toBe(true));

    test("optional param does not accept more than one argument",
        () => expect(Parameters.optionalParameter.accepts([1, 2])).toBe(false));

    test(">= 1 param does not accept no arguments",
        () => expect(Parameters.oneOrMoreParameter.accepts([])).toBe(false));

    test(">= 1 param accepts 1 arguments",
        () => expect(Parameters.oneOrMoreParameter.accepts([1])).toBe(true));

    test(">= 1 param accepts > 1 arguments",
        () => expect(Parameters.oneOrMoreParameter.accepts([1, 2])).toBe(true));

    test("<= 3 param accepts no arguments",
        () => expect(Parameters.atMost3Parameter.accepts([])).toBe(true));

    test("<= 3 param accepts 1 arguments",
        () => expect(Parameters.atMost3Parameter.accepts([1])).toBe(true));

    test("<= 3 param accepts 2 arguments",
        () => expect(Parameters.atMost3Parameter.accepts([1, 2])).toBe(true));

    test("<= 3 param accepts 3 arguments",
        () => expect(Parameters.atMost3Parameter.accepts([1, 2, 3])).toBe(true));

    test("<= 3 param does not accept more than 3 arguments",
        () => expect(Parameters.atMost3Parameter.accepts([1, 2, 3, 4])).toBe(false));

    test("== 2 param does not accept no arguments",
        () => expect(Parameters.exactly2Parameter.accepts([])).toBe(false));

    test("== 2 param does not accept less than 2 arguments",
        () => expect(Parameters.exactly2Parameter.accepts([1])).toBe(false));

    test("== 2 param accepts 2 arguments",
        () => expect(Parameters.exactly2Parameter.accepts([1, 2])).toBe(true));

    test("== 2 param does not accept more than 2 arguments",
        () => expect(Parameters.exactly2Parameter.accepts([1, 2, 3])).toBe(false));

    test("void param is void param",
        () => expect(Parameters.voidParameter.is(Parameters.voidParameter)).toBe(true));

    test("void param is not optional param",
        () => expect(Parameters.voidParameter.is(Parameters.optionalParameter)).toBe(false));

    test("void param is not variadic param",
        () => expect(Parameters.voidParameter.is(Parameters.variadicParameter)).toBe(false));

    test("optional param is not variadic param",
        () => expect(Parameters.voidParameter.is(Parameters.variadicParameter)).toBe(false));

    test("variadic param is variadic param",
        () => expect(Parameters.variadicParameter.is(Parameters.variadicParameter)).toBe(true));

    test("number param is number",
        () => expect(Parameters.numberParameter.is("number")).toBe(true));

    test("number param is not string",
        () => expect(Parameters.numberParameter.is("string")).toBe(false));

    test("number | string param is [number, string]",
        () => expect(Parameters.numberOrStringParameter.is(["number", "string"])).toBe(true));

    test("number | string param is not string",
        () => expect(Parameters.numberOrStringParameter.is("string")).toBe(false));

    test("number | string param is not [number, string, boolean]",
        () => expect(Parameters.numberOrStringParameter.is(["number", "string", "boolean"])).toBe(false));

    test("natural param is natural param",
        () => expect(Parameters.naturalParameter.is(Parameters.naturalParameter)).toBe(true));

    test("natural param is not number",
        () => expect(Parameters.naturalParameter.is(Parameters.numberParameter)).toBe(false));

    test("natural0 param is not natural1 param",
        () => expect(Parameters.naturalParameter.is(
            new Parameter({in: "number", requires: (n => n > 0)})))
            .toBe(false));
});