import { Injectable } from '@angular/core';
import { Dialect, DialectLookup, DialectPath, EndDialects } from '../models/dialect';
import hierarchyFiltered from './dialect_hierarchy_filtered.json';
import { Participant } from '../models/participant';
import { MatchedParts } from '../models/matched-parts';
import { FilterObjectName } from '../models/filter';

export type MatchedSubItem<T, K extends keyof T> = {
    // passthrough a selection of properties
    [P in keyof Pick<T, K>]: MatchedParts
} & {
    participantId: MatchedParts,
    dialects: MatchedParts[]
};

/**
 * Matched sub items grouped by their text
 */
export type MatchedSubItemGrouped<K extends string> = {
    [P in K]: MatchedParts
} & {
    text: string;
    participantIds: MatchedParts[];
};

@Injectable({
    providedIn: 'root'
})
export class DialectService {
    private readonly localizedDialects = {
        'Dutch': $localize`Dutch`,
        'Standaardnederlands': $localize`Standard Dutch`,
        'English': $localize`English`,
        'American': $localize`American`,
        'British': $localize`British`,
        'South African': $localize`South African`,
        'Frisian': $localize`Frisian`,
        'German': $localize`German`,
        'German (Ödingsch Platt)': $localize`Ödingsch Platt`,
        'German (Ostmittelbairisch)': $localize`Ostmittelbairisch`,
        'German (Westmittelbairisch)': $localize`Westmittelbairisch`,
        'Standard German': $localize`Standard German`,
        'Swedish': $localize`Swedish`,
        'South Swedish': $localize`South Swedish`,
    };

    private _dialectLookup: { [T in FilterObjectName]?: DialectLookup } = {};

    localize(name: string) {
        return this.localizedDialects[name] ?? name;
    }

    /**
     * Gets a lookup of all the dialects
     * @returns the top most dialects and a lookup with all the dialects
     */
    getDialectLookup(name: FilterObjectName): DialectLookup {
        if (this._dialectLookup[name]) {
            return this._dialectLookup[name];
        }
        const hierarchy: DialectLookup['hierarchy'] = {};
        const root = this.fillDialectLookup(hierarchyFiltered[name], hierarchy);
        return this._dialectLookup[name] = new DialectLookup(root, hierarchy);
    }

    fillDialectLookup(data: Object, hierarchy: DialectLookup['hierarchy'], parentName: string = undefined): Dialect[] {
        // dialects found at this level
        const dialects: Dialect[] = [];
        const parent: Dialect = parentName !== undefined ? hierarchy[parentName] : undefined;

        for (const [name, children] of Object.entries(data)) {
            let dialect: Dialect;
            if (dialect = hierarchy[name]) {
                // has multiple parents, append this parent
                if (parent) {
                    dialect.parents.push(parent);
                }
            } else {
                dialect = {
                    name,
                    label: this.localize(name),
                    children: [],
                    parents: parent !== undefined ? [parent] : []
                };

                hierarchy[name] = dialect;
                // the parent must exist in the hierarchy, before its children can be created
                hierarchy[name].children = this.fillDialectLookup(children, hierarchy, name)
            }

            dialects.push(dialect);
        }

        return dialects.sort((a, b) => a.name.localeCompare(b.name));
    }

    anyDialectInPaths(dialects: string[], paths: DialectPath[]): boolean {
        for (const path of paths) {
            for (const step of path.path) {
                for (const dialect of dialects) {
                    if (dialect === step) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getDialectPaths(objectName: FilterObjectName, dialect: string): DialectPath[] {
        const lookup = this.getDialectLookup(objectName);
        return lookup.paths[dialect];
    }

    initializeDialectTextParts(objectName: FilterObjectName) {
        const dialectTextParts: { [dialect: string]: MatchedParts } = {};
        for (const dialect of this.getDialectLookup(objectName).flattened) {
            dialectTextParts[dialect.name] = new MatchedParts({
                empty: false,
                emptyFilters: false,
                fullMatch: false,
                match: false,
                parts: [{
                    match: false,
                    text: dialect.name,
                    bold: false
                }]
            });
        }

        return dialectTextParts;
    }

    /**
     * Determines for each participant which are the most
     * salient dialects (the dialect path) with the most steps.
     * TODO: this should ideally be pre-determined on the server,
     * because this information is static.
     * @param participants participants to parse
     * @param dialectLookup lookup describing the dialect structure
     */
    determineParticipantEndDialects(participants: Participant[], dialectLookup: DialectLookup) {
        const endDialects: EndDialects = {};
        for (const participant of participants) {
            const participantEndDialects: string[] = [];
            for (const name of participant.dialects) {
                if (dialectLookup.isEndDialect(name, participant.dialects)) {
                    participantEndDialects.push(name);
                }
            }
            endDialects[participant.participantId] = participantEndDialects;
        }

        return endDialects;
    }

    /**
     * Recursively gets all the names of all the sub-dialects
     * @param objectName name of the filter object
     * @param name name of the parent dialect, not included in the output
     */
    *getAllSubDialects(objectName: FilterObjectName, name: string): Iterable<string> {
        const dialect = this.getDialectLookup(objectName).hierarchy[name];
        for (const child of this.getDialectLookup(objectName).findChildren(dialect)) {
            yield child.name;
        }
    }

    groupSubItems<T extends MatchedSubItem<T, K>,
        K extends keyof T & string,
        U extends keyof T & string>(
            objectName: FilterObjectName,
            matchedSubItems: T[],
            keys: [K, ...U[]],
            endDialects: EndDialects,
            countDialectMatch?: (subItem: T, dialect: string) => void): [
            { [dialect: string]: MatchedSubItemGrouped<K | U>[] },
            { [dialect: string]: MatchedParts }
        ] {
        // group answers by their dialect
        const matchedDialects: { [endDialects: string]: T[] } = {};
        const matchedDialectParts: { [dialect: string]: MatchedParts } = {};

        for (const subItem of matchedSubItems) {
            // did the answer match the filter on dialect?
            const subItemMatchedDialects: MatchedParts[] = [];
            for (const parts of subItem.dialects) {
                if (parts.match) {
                    matchedDialectParts[parts.text] = parts;
                    subItemMatchedDialects.push(parts);
                }
            }

            for (const dialect of endDialects[subItem.participantId.text]) {
                if ( // not matching on dialects: mark all the end dialects as matched
                    subItemMatchedDialects.length == 0
                    // only mark the dialects which were matched by the filters
                    || (this.anyDialectInPaths(
                        subItemMatchedDialects.map(x => x.text),
                        this.getDialectPaths(objectName, dialect)))) {
                    if (countDialectMatch) {
                        countDialectMatch(subItem, dialect);
                    }
                    matchedDialects[dialect] = [...matchedDialects[dialect] ?? [], subItem];
                }
            }
        }

        // then group them by their text
        const grouped: { [endDialects: string]: MatchedSubItemGrouped<K | U>[] } = {};

        for (const [dialect, answers] of Object.entries(matchedDialects)) {
            const dialectGroup: { [text: string]: T[] } = {};
            for (const answer of answers) {
                const text = answer[keys[0]].text;
                if (text in dialectGroup) {
                    dialectGroup[text].push(answer);
                } else {
                    dialectGroup[text] = [answer];
                }
            }

            // sort by text; put unattested last
            grouped[dialect] = [...Object.entries(dialectGroup)].sort(([textA], [textB]) =>
                textA === ''
                    ? 1
                    : textB === ''
                        ? -1
                        : textA.localeCompare(textB)
            ).map(([text, answers]) => {
                const result: any = {};
                for (const key of keys) {
                    result[key] = answers[0][key];
                };
                result.text = text;
                result.dialects = answers[0].dialects;
                result.participantIds = answers.map(answer => answer.participantId);

                return <MatchedSubItemGrouped<K | U>>result;
            });
        }
        return [grouped, matchedDialectParts];
    }
}
