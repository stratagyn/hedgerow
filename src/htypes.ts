import type {Parameter} from "./parameter";
import type {Operator} from "./operator";
import type {PolymorphicOperator} from "./polymorphic";

export type Clause<T = any> = (_: T) => boolean;

export type Constructor<T = any> = new (..._: any[]) => T;

export type EqualityComparer<T> = (a: T, b: T) => boolean;

export type Hedge<I extends HedgeFn = HedgeFn> = UnitOrArray<HedgeParams<number, I>[]>[];

export type HedgeDomain<
    N extends number = number,
    I extends HedgeFn = HedgeFn> = UnitOrArray<Prototype<N, I>>
    | HedgeDefinition<N, I>;

export type HedgeFn = (..._:any[][]) => any;

export type HedgeParams<
    N extends number = number,
    I extends HedgeFn = HedgeFn> =
      Parameters<I>[N] extends (infer E)[]
        ? E
        : never;

export type HedgeRegion<
    N extends number = number,
    I extends HedgeFn = HedgeFn> = UnitOrArray<HedgeDomain<N, I>
    | Parameter<N, I>>;

export type Maybe<T> = T | null | undefined;

export type Prototype<
    N extends number = number,
    I extends HedgeFn = HedgeFn> = string
                                 | Constructor<HedgeParams<N, I>>;

export type Range = [min: number, max: number];

export type ReturnDomain<I extends HedgeFn = HedgeFn> =
    UnitOrArray<string | Constructor<ReturnType<I>>> | Omit<HedgeDefinition, "range">;

export type Trilean = Maybe<boolean>;

export type UnitOrArray<T> = T | T[];

export interface HedgeDefinition<N extends number = number, I extends HedgeFn = HedgeFn> {
    in?: UnitOrArray<Prototype<N, I>>;
    requires?: Clause<HedgeParams<N, I>> | HedgeParams<N, I>[];
    range?: Range | number;
}

export interface HedgeFunction<I extends HedgeFn = HedgeFn> {
    (..._:any[]): ReturnType<I>;

    get operator(): Operator<I>;
}

export interface PolymorphicHedgeFunction {
    (..._:any[][]): any;

    get operator(): PolymorphicOperator;

    implement<I extends HedgeFn = HedgeFn>(
        ...ops: (Operator<I> | HedgeFunction<I>)[]): void;
}