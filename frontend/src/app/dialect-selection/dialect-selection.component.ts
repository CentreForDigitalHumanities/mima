import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeNodeSelectEvent, TreeNodeUnSelectEvent } from 'primeng/tree';
import { TreeSelectModule } from 'primeng/treeselect';
import { DialectPath } from '../models/dialect';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';
import { DialectService } from '../services/dialect.service';
import { FilterObjectName } from '../models/filter';

@Component({
    selector: 'mima-dialect-selection',
    standalone: true,
    imports: [FormsModule, TreeSelectModule, FilterTagsComponent],
    templateUrl: './dialect-selection.component.html',
    styleUrl: './dialect-selection.component.scss'
})
export class DialectSelectionComponent implements OnChanges {
    nodes: TreeNode<DialectPath>[];
    /**
     * To (un)select nodes with a different path but the same dialect name
     * (multiple parents).
     */
    nodesByName: { [path: string]: TreeNode<DialectPath>[] };
    selectedNodes: TreeNode<DialectPath>[];
    labels: { [key: string]: string };

    get selected(): string[] {
        if (!this.selectedNodes) {
            return [];
        }

        return [...new Set(this.selectedNodes.map(node => node.data.name))];
    }

    @Input()
    objectName: FilterObjectName;

    @Input()
    placeholder: string;

    @Input()
    content: string[];

    @Output()
    contentChange = new EventEmitter<string[]>();

    constructor(private dialectService: DialectService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.content && this.objectName) {
            if (!this.nodes) {
                this.fillNodes(this.objectName);
            }
            this.setContent(this.content);
        }
    }

    onNodeUnselect(event: TreeNodeUnSelectEvent) {
        const duplicates = this.nodesByName[(<DialectPath>event.node.data).name].filter(node => node.key !== event.node.key).map(node => node.key);
        if (duplicates.length) {
            this.selectedNodes = this.selectedNodes.filter(node => duplicates.indexOf(node.key) < 0);
        }

        this.outputContent();
    }

    onNodeSelect(event: TreeNodeSelectEvent) {
        const duplicates = this.nodesByName[(<DialectPath>event.node.data).name].filter(node => node.key !== event.node.key);
        if (duplicates.length) {
            this.selectedNodes = [...this.selectedNodes, ...duplicates];
        }

        this.outputContent();
    }

    private outputContent() {
        this.contentChange.next([...new Set(this.selectedNodes.map(x => x.data.name))]);
    }

    private setContent(value: string[]) {
        const selectedNodes: TreeNode<DialectPath>[] = [];
        for (const dialect of value) {
            selectedNodes.push(...this.nodesByName[dialect] ?? []);
        }

        if (this.selectedNodes &&
            this.selectedNodes.length === selectedNodes.length) {
            // the same? don't update!
            if (this.selectedNodes.map(x => x.data.name).every(dialect => value.indexOf(dialect) >= 0)) {
                return;
            }
        }

        this.selectedNodes = selectedNodes;
    }

    private fillNodes(name: FilterObjectName) {
        const lookup = this.dialectService.getDialectLookup(name);
        const nodes: TreeNode<DialectPath>[] = [];
        const nodesByPath: { [path: string]: TreeNode<DialectPath> } = {};
        const nodesByName: { [path: string]: TreeNode<DialectPath>[] } = {};

        // labels for the tag list
        const labels: { [key: string]: string } = {};

        for (const path of lookup.flattened) {
            // this works because the data is returned as an hierarchial tree
            // we can expect the parent to have been processed already!
            const parent = nodesByPath[path.parentsPathFlat];
            const node: TreeNode<DialectPath> = {
                key: path.pathFlat,
                parent,
                label: path.label,
                data: path
            };

            labels[node.data.name] = node.label;

            // this way we can also set the parents and children
            nodesByPath[path.pathFlat] = node;

            // for (un)selecting the nodes with the same name
            if (nodesByName[node.data.name]) {
                nodesByName[node.data.name].push(node);
            } else {
                nodesByName[node.data.name] = [node];
            }

            if (parent) {
                if (!parent.children) {
                    parent.children = [];
                    parent.leaf = true;
                }

                parent.children.push(node);
            } else {
                nodes.push(node);
            }
        }

        this.labels = labels;
        this.nodes = nodes;
        this.nodesByName = nodesByName;
    }
}
