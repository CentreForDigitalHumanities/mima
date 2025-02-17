export interface Dialect {
    name: string,
    parents: Dialect[],
    children: Dialect[]
}

export type EndDialects = { [participantId: string]: string[] };

export interface DialectPath {
    /**
     * Name of the final dialect
     */
    name: string;
    /**
     * Full path including itself. A dialect can have multiple parents,
     * it would then have multiple *paths* for each of those parents!
     */
    path: string[];
    /**
     * Flattened full path
     */
    pathFlat: string;
    /**
     * Flattened full path to the parent
     */
    parentsPathFlat: string;
}

export class DialectLookup {
    /**
     * Contains the hierarchial list flattened to a list of dialect names
     * and their full paths.
     */
    public flattened!: DialectPath[];

    /**
     * Gets all the end dialects with their paths
     */
    public paths!: { [endDialect: string]: DialectPath[] };

    constructor(
        /**
         * The dialects at the top of the tree
         */
        public root: Dialect[],
        /**
         * All the dialects
         */
        public hierarchy: { [dialect: string]: Dialect }) {
        this.flattened = [...this.flatten(this.root)];
        this.paths = {};
        for (const path of this.flattened) {
            if (path.name in this.paths) {
                this.paths[path.name].push(path);
            } else {
                this.paths[path.name] = [path];
            }
        }
    }

    /**
     * Is the given dialect the final level of specificity in
     * the passed list of dialects?
     * @param name
     * @param dialects
     * @returns
     */
    isEndDialect(name: string, dialects: string[]): boolean {
        const dialect = this.hierarchy[name];
        if (!dialect) {
            // missing dialect (might be the "Overgangsdialect"?)
            return false;
        }

        // are any of the dialects children (if any) present?
        // only if they aren't present (or there are no
        // children of the dialect to begin with)
        // then this dialect is an end dialect
        for (const childDialect of this.findChildren(dialect)) {
            if (dialects.indexOf(childDialect.name) >= 0) {
                return false;
            }
        }

        return true;
    }

    *findChildren(dialect: Dialect): Iterable<Dialect> {
        yield* dialect.children;
        for (const child of dialect.children) {
            yield* this.findChildren(child);
        }
    }

    private *flatten(dialects: Dialect[], path: string[] = []): Iterable<DialectPath> {
        for (const dialect of dialects) {
            const dialectPath = [...path, dialect.name];
            yield {
                name: dialect.name,
                path: dialectPath,
                pathFlat: dialectPath.join('>'),
                parentsPathFlat: path.join('>')
            };

            yield* this.flatten(dialect.children, dialectPath);
        }
    }
};
