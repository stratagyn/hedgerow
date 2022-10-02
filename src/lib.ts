import type {
    HedgeDefinition, HedgeDomain, HedgeFn, HedgeFunction, HedgeParams,
    HedgeRegion, PolymorphicHedgeFunction, Prototype, UnitOrArray
} from "./htypes";

import {capitalize, has, invalid, isempty, nameof, prototypeof} from "./_cmn_";
import {Parameter} from "./parameter";
import {Operator} from "./operator";
import {PolymorphicOperator} from "./polymorphic";

export const accepts = <I extends HedgeFn = HedgeFn>(
    hedges: HedgeParams<number, I>[][],
    region: Parameter<number, I>[]): boolean => {
    const n = hedges.length;

    if ((n === 0) &&
        ((region.length === 0) ||
            (region.map(parameter => parameter.range[0]).reduce((x, y) => x + y) === 0)))
        return true;

    if (n !== region.length) {
        if (n > region.length)
            return false;

        return region.slice(n).every(parameter => parameter.range[0] === 0) &&
            region.slice(0, n).every((parameter, i) => parameter.accepts(hedges[i]));
    }

    return region.every((parameter, i) => parameter.accepts(hedges[i]));
}

export const ancestry = (obj: any): string[] => {
    if (obj == undefined)
        return [];

    const ancestors = (child: any, ctors?: Set<string>): Set<string> => {
        ctors ??= new Set<string>();

        let prototype;

        if (child == undefined || ((prototype = prototypeof(child)) == undefined))
            return ctors;

        return ancestors(prototype, ctors.add(prototype));
    }

    return Array.from(ancestors(prototypeof(obj)))
        .map(ctor => ctor.constructor.name);
}

export const bind = <I extends HedgeFn = HedgeFn>(
    args: HedgeParams<number, I>[],
    region: Parameter<number, I>[]): HedgeParams<number, I>[][] => {
    if (isempty(region) || (region.length === 1 && isvoid(region[0]))) {
        if (args.length > 0)
            throw invalid("Arguments", "No parameters for given arguments");

        return [];
    }

    if (region.length === 1 && isopen(region[0]))
        return [[...args]] as HedgeParams<number, I>[][];

    return collect<I>(args, region);
}

export const domain = <N extends number = number, I extends HedgeFn = HedgeFn>(
    definition: HedgeDefinition<N, I>): HedgeDefinition<N, I> => {
    if (isempty(definition))
        return {};

    const [type, range] = [definition.in|| "object", definition.range];
    let [min, max] = typeof range == "number"
        ? range === -1 ? [0, range] : [range, range]
        : range || [1, 1];

    if (min >= 0 && max >= 0 && max < min)
        [min, max] = [max, min];

    const normalized: HedgeDefinition<N, I> =  {
        in: Array.isArray(type)
            ? type.map(utype => nameof(utype))
            : nameof(type),
        range: [Math.max(0, min), Math.max(-1, max)]
    };

    if (definition.requires)
        normalized.requires = definition.requires;

    return normalized;
}

export const isclosed = <N extends number = number, I extends HedgeFn = HedgeFn>(
    domain: Parameter<N, I>): boolean => !(isopen(domain) || isdegenerate(domain));

export const isdegenerate = <N extends number = number, I extends HedgeFn = HedgeFn>(
    domain: Parameter<N, I>): boolean => domain.range[0] === domain.range[1];

export const isinteger = (n: number) => !(/[0-9]*\.[0-9]+/.test('' + n));

export const isnatural = (base: 0 | 1 = 1) => (n: number) => isinteger(n) && n >= base;

export const isopen = <N extends number = number, I extends HedgeFn = HedgeFn>(
    domain: Parameter<N, I>): boolean => domain.range[1] === -1 && !isdegenerate(domain);

export const isvoid = <N extends number = number, I extends HedgeFn = HedgeFn>(
    domain: Parameter<N, I>): boolean => !(domain.range[0] || domain.range[1]);

export const isinstance = (obj: any, ...types: Prototype[]) => {
    const kind = obj == undefined
        ? typeof undefined
        : capitalize(typeof obj === "object"
            ? obj.constructor.name
            : typeof obj);

    return types.some(type => {
        const name = typeof type === "string" ? type : type.name;
        return obj == undefined ? name === "undefined" : capitalize(name) === kind;
    });
}

export const issubtype = (obj: any, ...types: Prototype[]) => {
    const lin = lineage(obj);

    return types.some(type => {
        const name = typeof type === "string" ? type : type.name;

        return has(lin, obj == undefined ? name : capitalize(name));
    });
}

export const lineage = (obj: any): string[] =>
    obj == undefined ? [typeof obj] : [prototypeof(obj).constructor.name, ...ancestry(obj)];

export const op = <I extends HedgeFn = HedgeFn>(region: HedgeRegion<number, I>,
                                                f: I): HedgeFunction<I> => {
    const operator = new Operator<I>(region, f);

    const g = (..._: (UnitOrArray<HedgeParams<number, I>>)[]): ReturnType<I> =>
        operator.of(...((
            _.every(arg => Array.isArray(arg))
                ? _ as HedgeParams<number, I>[][]
                : bind<I>(_ as HedgeParams<number, I>[], operator.region))));

    g.operator = operator;

    return g;
}

export const optional = <N extends number = number, I extends HedgeFn = HedgeFn>(
    type: UnitOrArray<Prototype<N, I>> | Omit<HedgeDefinition<N, I>, "range"> = "object",
    max: number = 1): Parameter<N, I> =>
    new Parameter<N, I>({
        ...(typeof type === "string" || typeof type === "function" || Array.isArray(type))
            ? {in: type}
            : type,
        range: [0, Math.max(Math.trunc(max), 1)]
    });

export const pattern = (
    type: UnitOrArray<Prototype>,
    patterns: [Omit<HedgeDefinition, "in">, HedgeFn][]): PolymorphicHedgeFunction =>
    polyop(...patterns.map(([region, f]) => op({in: type, ...region}, f)));

export const polyop = (..._:(Operator | HedgeFunction)[]): PolymorphicHedgeFunction => {
    const op = new PolymorphicOperator();

    const f = (..._:any[]) => op.of(..._.map(arg => Array.isArray(arg) ? arg : [arg]));

    f.operator = op;

    f.implement = (..._: (Operator | HedgeFunction)[]) =>
        _.forEach(impl =>
            op.implement(impl instanceof Operator ? impl : impl.operator));

    f.implement(..._);

    return f;
}

export const region = <N extends number = number, I extends HedgeFn = HedgeFn>(
    domain: HedgeRegion<N, I>): UnitOrArray<Parameter<N, I>> => {
    const init = (parameter: HedgeDomain<N, I> | Parameter<N, I>) =>
        parameter instanceof Parameter
            ? parameter as Parameter<N, I>
            : new Parameter<N, I>(parameter);

    return Array.isArray(domain) ? domain.map(p => init(p)) : [init(domain)];
}

export const variadic = <N extends number = number, I extends HedgeFn = HedgeFn>(
    type: UnitOrArray<Prototype<N, I>> | Omit<HedgeDefinition<N, I>, "range"> = "object",
    min: number = 0): Parameter<N, I> =>
    new Parameter<N, I>({
        ...(typeof type === "string" || typeof type === "function" || Array.isArray(type))
            ? {in: type}
            : type,
        range: [Math.max(Math.trunc(min), 0), -1]
    });

function collect<I extends HedgeFn = HedgeFn>(
    args: HedgeParams<number, I>[],
    params: Parameter<number, I>[]): HedgeParams<number, I>[][] {

    const hedges: any[][] = [];
    const argCount = args.length;
    let argIndex = 0;

    params.forEach((parameter, i) => {
        const [min, max] = parameter.range;

        if ((argCount - argIndex) < min) {
            const range = isdegenerate(parameter)
                ? `{${min}}`
                : `{${min}..${max}}`;

            throw invalid("Arguments",
                `Not enough arguments for parameter: Parameter.${i}: ${range}`);
        }

        let group = pullArguments(args.slice(argIndex), parameter);

        if (group.length < min) {
            const range = isdegenerate(parameter)
                ? `{${min}}`
                : `{${min}..${max}}`;

            throw invalid("Arguments",
                `Not enough arguments for parameter: Parameter.${i + 1}: ${range}`);
        }

        hedges.push(group);
        argIndex += group.length;
    });

    if (argIndex !== args.length)
        throw invalid("Arguments", `Too many arguments to bind: ${args.length}`);

    return hedges;
}

function pullArguments <I extends HedgeFn = HedgeFn>(
    args: HedgeParams<number, I>[],
    parameter: Parameter<number, I>): HedgeParams <number, I>[] {

    const group: any[] = [];
    const max = isopen(parameter)
        ? args.length
        : parameter.range[1];

    for (let i = 0; i < max && parameter.accepts(args[i]); i++)
        group.push(args[i]);

    return group;
}