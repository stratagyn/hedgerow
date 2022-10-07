import type {
    Clause, HedgeDomain, HedgeFn, HedgeParams, Maybe,
    Prototype, Range, ReturnDomain, Trilean, UnitOrArray
} from "./htypes";

import {has, isempty, issimilar, nameof} from "./_cmn_";
import * as $ from "./api"

const parsePrototypes = (...prototypes: Prototype[]): {[key: string]: Trilean} => {
    const parsePrototype = (prototype: Prototype) =>
        typeof prototype === "string" && (prototype.endsWith("!") || prototype.endsWith(":"))
            ? [prototype.substring(0, prototype.length - 1),
                prototype.endsWith(":") ? true : undefined]
            : [nameof(prototype), false];

    return Object.fromEntries(prototypes.map(p => parsePrototype(p)));
}

export class Parameter<N extends number = number, I extends HedgeFn = HedgeFn> {
    public static readonly Void: Parameter = new Parameter();

    readonly #type:{[key: string]: Trilean};
    readonly #clause: Maybe<Clause<HedgeParams<N, I>>>
    readonly #literals: HedgeParams<N, I>[];
    readonly #range: [left: number, right: number];

    constructor(domain: HedgeDomain<N, I> = {}) {
        [
            this.#type,
            this.#clause,
            this.#literals,
            this.#range,
        ] = this.#init(domain);
    }

    get clause(): Maybe<Clause<HedgeParams<N, I>> | HedgeParams<N, I>[]> {
        return this.#literals.length === 0 ? this.#clause : this.#literals;
    }

    get type(): {[key: string]: Trilean } {
        return {...this.#type};
    }

    get range(): [left: number, right: number] {
        return this.#range;
    }

    accepts = (args: UnitOrArray<HedgeParams<N, I>>): boolean => {
        const [min, max] = this.#range;

        if (!Array.isArray(args))
            args = [args];

        if (args.length < min || (max >= 0 && args.length > max))
            return false;

        if ($.isvoid(this))
            return true;

        const [type, clause] = [this.#type, this.#clause!];

        return args.every(arg => (!clause || clause(arg)) &&
            Object.entries(type).some(([t, subtypesOnly]) =>
                (subtypesOnly == undefined ? $.isinstance : $.issubtype)(arg, t) &&
                !(subtypesOnly && $.isinstance(arg, t))));
    }

    is = (type: HedgeDomain<N, I> | Parameter<N, I>): boolean =>
        !(typeof type === "string" || Array.isArray(type) || typeof type === "function")
            ? this.#compareTo(type instanceof Parameter
                ? type as Parameter<N, I>
                : new Parameter<N, I>(type))
            : !this.#clause
            && issimilar(
                this.#type,
                Array.isArray(type) ? parsePrototypes(...type) : parsePrototypes(type));

    #compareTo = (parameter: Parameter<N, I>): boolean =>
        ($.isvoid(this) && $.isvoid(parameter)) ||
        ((this.#range[0] === parameter.range[0]) &&
            (this.#range[1] === parameter.range[1]) &&
            issimilar(this.#type, parameter.type) &&
            (Array.isArray(this.clause)
                ? Array.isArray(parameter.clause) && issimilar(this.clause, parameter.clause)
                : this.clause === parameter.clause));

    #init(domain: HedgeDomain<N, I>):
        [{[key: string]: Trilean}, Maybe<Clause<HedgeParams<N, I>>>, any[], Range] {

        if (typeof domain === "string" || typeof domain === "function" || Array.isArray(domain))
            return [
                !Array.isArray(domain)
                    ? parsePrototypes(domain)
                    : parsePrototypes(...domain),
                undefined,
                [],
                [1, 1]];

        if (isempty(domain))
            return [{}, undefined, [], [0, 0]];

        const definition = $.domain(domain);

        if (Array.isArray(definition.range) &&
            definition.range[0] === 0 && definition.range[1] === 0)
            return [{}, undefined, [], [0, 0]];

        const hasLiterals = Array.isArray(definition.requires);
        const literals = hasLiterals ? definition.requires as HedgeParams<N, I>[] : [];

        return [
            Array.isArray(definition.in)
                ? parsePrototypes(...definition.in)
                : parsePrototypes(definition.in ?? "object"),
            hasLiterals
                ? (_: HedgeParams<N, I>) => has(literals, _)
                : definition.requires as Clause<HedgeParams<N, I>>,
            literals,
            definition.range as [number, number]
        ];
    }
}

export class ReturnParameter<I extends HedgeFn = HedgeFn> {
    public static readonly Void: Parameter = new Parameter();

    readonly #type:{[key: string]: Trilean};
    readonly #clause: Maybe<Clause<ReturnType<I>>>
    readonly #literals: ReturnType<I>[];

    constructor(domain: ReturnDomain<I> = {}) {
        [
            this.#type,
            this.#clause,
            this.#literals,
        ] = this.#init(domain);
    }

    get clause(): Maybe<Clause<ReturnType<I>> | ReturnType<I>[]> {
        return this.#literals.length === 0 ? this.#clause : this.#literals;
    }

    get type(): {[key: string]: Trilean } {
        return {...this.#type};
    }

    accepts = (value: ReturnType<I>): boolean => {

        const [type, clause] = [this.#type, this.#clause!];

        return !clause || clause(value) &&
            Object.entries(type).some(([t, subtypesOnly]) =>
                (subtypesOnly == undefined ? $.isinstance : $.issubtype)(value, t) &&
                !(subtypesOnly && $.isinstance(value, t)));
    }

    is = (type: ReturnDomain<I> | ReturnParameter<I>): boolean =>
        !(typeof type === "string" || Array.isArray(type) || typeof type === "function")
            ? this.#compareTo(type instanceof ReturnParameter
                ? type as ReturnParameter<I>
                : new ReturnParameter<I>(type))
            : !this.#clause
            && issimilar(
                this.#type,
                Array.isArray(type) ? parsePrototypes(...type) : parsePrototypes(type));

    #compareTo = (parameter: ReturnParameter<I>): boolean =>
        issimilar(this.#type, parameter.type) &&
            (Array.isArray(this.clause)
                ? Array.isArray(parameter.clause) && issimilar(this.clause, parameter.clause)
                : this.clause === parameter.clause);

    #init(domain: ReturnDomain<I>):
        [{[key: string]: Trilean}, Maybe<Clause<ReturnType<I>>>, any[]] {

        if (typeof domain === "string" || typeof domain === "function" || Array.isArray(domain))
            return [
                !Array.isArray(domain)
                    ? parsePrototypes(domain)
                    : parsePrototypes(...domain),
                undefined,
                []];

        if (isempty(domain))
            return [{}, undefined, []];

        const definition = $.domain(domain);

        if (Array.isArray(definition.range) &&
            definition.range[0] === 0 && definition.range[1] === 0)
            return [{}, undefined, []];

        const hasLiterals = Array.isArray(definition.requires);
        const literals = hasLiterals ? definition.requires as ReturnType<I>[] : [];

        return [
            Array.isArray(definition.in)
                ? parsePrototypes(...definition.in)
                : parsePrototypes(definition.in ?? "object"),
            hasLiterals
                ? (_: ReturnType<I>) => has(literals, _)
                : definition.requires as Clause<ReturnType<I>>,
            literals
        ];
    }
}