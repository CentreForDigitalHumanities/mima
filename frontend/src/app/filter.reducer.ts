import { Filter, FilterField, FilterObjectName, FilterOperator } from "./models/filter";
import { isDefaultFilter } from "./services/filter.service";

export function handleIncludeFilter<TIn extends FilterObjectName, TOut extends {
    filters: readonly Filter<TIn>[],
    operator: FilterOperator
}>(
    state: TOut,
    action: {
        field: FilterField<TIn>,
        /**
         * The first item should be the parent content, for example when filtering on dialects
         * the first item is the one which the user clicked on. The following items
         * are the subdialects. The main item is determined whether it should be interpreted
         * as toggle (adding it versus toggling)
         */
        content: string[]
    }): TOut {
    // remove default filter
    const filters = state.filters.filter(filter => !isDefaultFilter(filter));

    // find existing filter on this field
    const filterIndex = filters.findIndex(filter => filter.field === action.field);
    let existing: string[] = [];
    if (filterIndex !== -1) {
        for (let i = filterIndex; i < filters.length;) {
            if (filters[i].field === action.field) {
                existing.push(...filters[i].content);
                if (i > filterIndex) {
                    // remove any more filters on this field
                    filters.splice(i, 1);
                    continue;
                }
            }

            i++;
        }
    }

    if (existing.indexOf(action.content[0]) >= 0) {
        // if it was already included, make it exclusive
        existing = [];
    }

    const newFilter: Filter<TIn> = {
        field: action.field,
        content: [...new Set([...existing, ...action.content])],
        index: filterIndex === -1 ? filters.length : filterIndex,
        onlyFullMatch: true
    };

    if (filterIndex === -1) {
        filters.push(newFilter);
    } else {
        filters[filterIndex] = newFilter;
    }

    return {
        ...state,
        filters,
        // new filter? set it to AND, else preserve the current operator
        operator: state.filters.length >= 2 ? state.operator : <FilterOperator>'and'
    };
}

export function handleExcludeFilter<TIn extends FilterObjectName, TOut extends {
    filters: readonly Filter<TIn>[],
    operator: FilterOperator
}>(
    state: TOut,
    action: {
        field: FilterField<TIn>,
        include: string[],
        exclude: string[]
    }): TOut {
    // remove default filter
    const filters = state.filters.filter(filter => !isDefaultFilter(filter));

    // find existing filter on this field
    const filterIndex = filters.findIndex(filter => filter.field === action.field);
    if (filterIndex !== -1) {
        for (let i = filterIndex; i < filters.length;) {
            if (filters[i].field === action.field) {
                // remove this item from existing filters
                const content = filters[i].content.filter(c => action.exclude.indexOf(c) < 0);
                if (content.length === 0) {
                    filters.splice(i, 1);
                } else {
                    filters[i] = {
                        ...filters[i],
                        content
                    };
                    i++;
                }
            } else {
                i++;
            }
        }
    }
    if (filterIndex === -1) {
        const newFilter: Filter<TIn> = {
            field: action.field,
            content: action.include.filter(c => action.exclude.indexOf(c) < 0),
            index: filters.length,
            onlyFullMatch: true
        };

        filters.push(newFilter);
    }

    if (filters.length === 0) {
        // need to have at least one default filter
        filters.push({
            content: [],
            field: '*',
            index: 0,
            onlyFullMatch: false
        });
    }

    return {
        ...state,
        filters,
        // new filter? set it to AND, else preserve the current operator
        operator: state.filters.length >= 2 ? state.operator : <FilterOperator>'and'
    };
}


export function handleRemoveFilter<TIn extends FilterObjectName, TOut extends {
    filters: readonly Filter<TIn>[]
}>(
    defaultFilters: readonly Filter<TIn>[],
    state: TOut,
    action: {
        filterIndex: number
    }): TOut {
    let filters: Filter<TIn>[];
    if (state.filters.length > 1) {
        filters = [];
        for (let i = 0; i < state.filters.length; i++) {
            if (i < action.filterIndex) {
                filters.push(state.filters[i]);
            } else if (i > action.filterIndex) {
                filters.push({
                    ...state.filters[i],
                    index: i - 1
                });
            }
        }
    }

    return {
        ...state,
        filters: filters?.length > 0 ? filters : defaultFilters
    };
}
