import { Filter, FilterObjectName, FilterOperator } from "./models/filter";

interface FilterProperties<T extends FilterObjectName> {
    operator: FilterOperator;
    filters: ReadonlyArray<Filter<T>>;
}

export type FilterState<TKey extends string, TType extends FilterObjectName> = {
    [key in TKey]: FilterProperties<TType>
};
