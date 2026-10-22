import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialect } from '../models/dialect';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';
import { DialectService } from '../services/dialect.service';
import { FilterObjectName } from '../models/filter';
import {MatTreeModule, MatTreeNestedDataSource} from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';

type DialectNode = {
    selected: boolean;
    indeterminate: boolean;
    data: Dialect;
    parents: DialectNode[];
    children: DialectNode[];
}

@Component({
    selector: 'mima-dialect-selection',
    standalone: true,
    imports: [
        FormsModule,
        FilterTagsComponent,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule,
    ],
    templateUrl: './dialect-selection.component.html',
    styleUrl: './dialect-selection.component.scss'
})
export class DialectSelectionComponent implements OnChanges {
    nodes?: DialectNode[];
    /**
     * To (un)select nodes with a different path but the same dialect name
     * (multiple parents).
     */
    // nodesByName: { [path: string]: DialectNode[] };
    // selectedNodes: DialectNode[];
    // labels: { [key: string]: string };

    // get selected(): string[] {
    //     if (!this.selectedNodes) {
    //         return [];
    //     }

    //     return [...new Set(this.selectedNodes.map(node => node.data.name))];
    // }

    @Input()
    objectName: FilterObjectName;

    @Input()
    placeholder?: string;

    @Input()
    content: string[];

    @Output()
    contentChange = new EventEmitter<string[]>();

    treeControl = new NestedTreeControl<DialectNode>(node => node.children);
    dataSource = new MatTreeNestedDataSource<DialectNode>();

    childrenAccessor = (dialect: Dialect) => dialect.children;
    hasChild = (_: number, dialect: Dialect) => dialect.children.length > 0;

    constructor(private dialectService: DialectService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.content && this.objectName) {
            if (!this.nodes) {
                this.fillNodes(this.objectName);
            }
            // this.setContent(this.content);
        }
    }

    onNodeSelect(node: DialectNode, value: boolean) {
        node.selected = value;
        this.setChildren(node);
        if (node.parents.length) {
            const root = node.parents[0];
            this.checkValue(root);
        }
    }

    private setChildren(node: DialectNode) {
        for (let child of node.children) {
            child.selected = node.selected;
            this.setChildren(child);
        }
    }

    private checkValue(node: DialectNode) {
        if (node.children.length) {
            node.children.forEach(child => this.checkValue(child));

            if (node.children.find(child => child.indeterminate) ||
                (node.children.find(child => child.selected) && node.children.find(child => !child.selected))
            ) {
                node.indeterminate = true;
                node.selected = false;
            } else if (
                node.children.find(child => child.selected)
            ) {
                node.indeterminate = false;
                node.selected = true;
            } else {
                node.indeterminate = false;
                node.selected = false;
            }
        }
    }

    // onNodeSelect(event: TreeNodeSelectEvent) {
    //     const duplicates = this.nodesByName[(<DialectPath>event.node.data).name].filter(node => node.key !== event.node.key);
    //     if (duplicates.length) {
    //         this.selectedNodes = [...this.selectedNodes, ...duplicates];
    //     }

    //     this.outputContent();
    // }

    // private outputContent() {
    //     this.contentChange.next([...new Set(this.selectedNodes.map(x => x.data.name))]);
    // }

    // private setContent(value: string[]) {
    //     const selectedNodes: DialectNode[] = [];
    //     for (const dialect of value) {
    //         selectedNodes.push(...this.nodesByName[dialect] ?? []);
    //     }

    //     if (this.selectedNodes &&
    //         this.selectedNodes.length === selectedNodes.length) {
    //         // the same? don't update!
    //         if (this.selectedNodes.map(x => x.data.name).every(dialect => value.indexOf(dialect) >= 0)) {
    //             return;
    //         }
    //     }

    //     this.selectedNodes = selectedNodes;
    // }

    private fillNodes(name: FilterObjectName) {
        const lookup = this.dialectService.getDialectLookup(name);
        // const nodes: DialectNode[] = [];
        // const nodesByPath: { [path: string]: DialectNode } = {};
        // const nodesByName: { [path: string]: DialectNode[] } = {};

        // labels for the tag list
        // const labels: { [key: string]: string } = {};

        // for (const path of lookup.flattened) {
        //     // this works because the data is returned as an hierarchial tree
        //     // we can expect the parent to have been processed already!
        //     const parent = nodesByPath[path.parentsPathFlat];
        //     const node: DialectNode = {
        //         key: path.pathFlat,
        //         parent,
        //         label: path.label,
        //         data: path
        //     };

        //     labels[node.data.name] = node.label;

        //     // this way we can also set the parents and children
        //     nodesByPath[path.pathFlat] = node;

        //     // for (un)selecting the nodes with the same name
        //     if (nodesByName[node.data.name]) {
        //         nodesByName[node.data.name].push(node);
        //     } else {
        //         nodesByName[node.data.name] = [node];
        //     }

        //     if (parent) {
        //         if (!parent.children) {
        //             parent.children = [];
        //             parent.leaf = true;
        //         }

        //         parent.children.push(node);
        //     } else {
        //         nodes.push(node);
        //     }
        // }

        // this.labels = labels;
        this.nodes = this.parseNodes(lookup.root, []);
        this.dataSource.data = this.nodes;
        // this.nodesByName = nodesByName;
    }

    private parseNodes(dialects: Dialect[], parents: DialectNode[]): DialectNode[] {
        return dialects.map(dialect => {
            const self = {
                data: dialect,
                parents,
                children: [] as DialectNode[],
                selected: false,
                indeterminate: false,
            }
            self.children = this.parseNodes(dialect.children, [...parents, self]);
            return self;
        });
    }
}
