import { Injectable } from '@angular/core';
import { Dialect, DialectLookup, DialectPath, EndDialects } from '../models/dialect';
import data from './dialect_hierarchy.json';
import { Participant } from '../models/participant';

@Injectable({
    providedIn: 'root'
})
export class DialectService {

    private _dialectLookup: DialectLookup;
    get dialectLookup(): DialectLookup {
        if (!this._dialectLookup) {
            this._dialectLookup = this.getDialectLookup();
        }

        return this._dialectLookup;
    }

    /**
     * Gets a lookup of all the dialects
     * @returns the top most dialects and a lookup with all the dialects
     */
    private getDialectLookup(): DialectLookup {
        const hierarchy: DialectLookup['hierarchy'] = {};
        const root = this.fillDialectLookup(data, hierarchy);
        return new DialectLookup(root, hierarchy);
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

    getDialectPaths(dialect: string): DialectPath[] {
        const lookup = this.dialectLookup;
        return lookup.paths[dialect];
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
     * @param name name of the parent dialect, not included in the output
     */
    *getAllSubDialects(name: string): Iterable<string> {
        const dialect = this.dialectLookup.hierarchy[name];
        for (const child of this.dialectLookup.findChildren(dialect)) {
            yield child.name;
        }
    }
}
