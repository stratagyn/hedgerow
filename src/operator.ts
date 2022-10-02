import type {
    HedgeFn,
    HedgeParams,
    HedgeRegion,
    Maybe,
    ReturnDomain,
    UnitOrArray
} from "./htypes";

import {invalid, isempty, stringify, wrap} from "./_cmn_";
import {Parameter, ReturnParameter} from "./parameter";
import * as $ from "./lib";
import {isvoid} from "./lib";

const validateRegion = <I extends HedgeFn = HedgeFn>(domain: Parameter<number, I>[]):
    Parameter<number, I>[] => {

    if (isempty(domain))
        return [new Parameter<number, I>()];

    if (domain.length > 1 && domain.some(parameter => isvoid(parameter)))
        throw invalid("Domain", "Void parameter in domain");

    return domain;
}

export class Operator<I extends HedgeFn = HedgeFn> {
    readonly #region: Parameter<number, I>[];
    readonly #f: I;
    readonly #ensures: Maybe<ReturnParameter<I>>

    constructor(region: HedgeRegion<number, I>,
                f: I,
                ensures?: ReturnDomain<I> | ReturnParameter<I>) {

        this.#region = validateRegion(wrap($.region(region)));
        this.#f = f;
        this.#ensures = ensures instanceof ReturnParameter
            ? ensures
            : new ReturnParameter<I>(ensures);
    }

    get f(): I {
        return this.#f;
    }

    get region(): Parameter<number, I>[] {
        return this.#region;
    }

    of = (...hedges: UnitOrArray<HedgeParams<number, I>>[]): ReturnType<I> => {
        const res = this.#call(
            hedges.every(arg => Array.isArray(arg))
                ? hedges as HedgeParams<number, I>[][]
                : $.bind(hedges as HedgeParams<number, I>[], this.region)
        );

        if (this.#ensures && !this.#ensures.accepts(res))
            throw invalid("Return value", res.toString());

        return res;
    }

    #call(hedges: HedgeParams<number, I>[][]): ReturnType<I> {
        if (!$.accepts(hedges, this.#region))
            throw invalid("Call", `Arguments not in operator domain: ${stringify(hedges)}`);

        return this.#f(...hedges);
    }
}