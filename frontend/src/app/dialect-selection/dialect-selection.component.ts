import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeNodeSelectEvent, TreeNodeUnSelectEvent } from 'primeng/tree';
import { TreeSelectModule } from 'primeng/treeselect';
import { Dialect } from '../models/dialect';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';
import { DialectService } from '../services/dialect.service';

@Component({
    selector: 'mima-dialect-selection',
    standalone: true,
    imports: [FormsModule, TreeSelectModule, FilterTagsComponent],
    templateUrl: './dialect-selection.component.html',
    styleUrl: './dialect-selection.component.scss'
})
export class DialectSelectionComponent {
    nodes: TreeNode<Dialect>[];
    /**
     * To (un)select nodes with a different path but the same dialect name
     * (multiple parents).
     */
    nodesByName: { [path: string]: TreeNode<Dialect>[] };
    selectedNodes: TreeNode<Dialect>[];
    labels: { [key: string]: string };

    get selected(): string[] {
        if (!this.selectedNodes) {
            return [];
        }

        return [...new Set(this.selectedNodes.map(node => node.label))];
    }

    @Input()
    placeholder: string;

    @Input()
    set content(value: string[]) {
        this.setContent(value);
    }

    @Output()
    contentChange = new EventEmitter<string[]>();

    constructor(private dialectService: DialectService) {
        this.fillNodes();
    }

    onNodeUnselect(event: TreeNodeUnSelectEvent) {
        const duplicates = this.nodesByName[event.node.label].filter(node => node.key !== event.node.key).map(node => node.key);
        if (duplicates.length) {
            this.selectedNodes = this.selectedNodes.filter(node => duplicates.indexOf(node.key) < 0);
        }

        this.outputContent();
    }

    onNodeSelect(event: TreeNodeSelectEvent) {
        const duplicates = this.nodesByName[event.node.label].filter(node => node.key !== event.node.key);
        if (duplicates.length) {
            this.selectedNodes = [...this.selectedNodes, ...duplicates];
        }

        this.outputContent();
    }

    private outputContent() {
        this.contentChange.next([...new Set(this.selectedNodes.map(x => x.label))]);
    }

    private setContent(value: string[]) {
        const selectedNodes: TreeNode<Dialect>[] = [];
        for (const dialect of value) {
            selectedNodes.push(...this.nodesByName[dialect]);
        }

        if (this.selectedNodes &&
            this.selectedNodes.length === selectedNodes.length) {
            // the same? don't update!
            if (this.selectedNodes.map(x => x.label).every(dialect => value.indexOf(dialect) >= 0)) {
                return;
            }
        }

        this.selectedNodes = selectedNodes;
    }

    private fillNodes() {
        const lookup = this.dialectService.dialectLookup;
        const nodes: TreeNode<Dialect>[] = [];
        const nodesByPath: { [path: string]: TreeNode<Dialect> } = {};
        const nodesByName: { [path: string]: TreeNode<Dialect>[] } = {};

        // labels for the tag list
        const labels: { [key: string]: string } = {};

        for (const path of lookup.flattened) {
            // this works because the data is returned as an hierarchial tree
            // we can expect the parent to have been processed already!
            const parent = nodesByPath[path.parentsPathFlat];
            const node: TreeNode<Dialect> = {
                key: path.pathFlat,
                parent,
                label: path.name
            };

            labels[path.name] = path.name;

            // this way we can also set the parents and children
            nodesByPath[path.pathFlat] = node;

            // for (un)selecting the nodes with the same name
            if (nodesByName[path.name]) {
                nodesByName[path.name].push(node);
            } else {
                nodesByName[path.name] = [node];
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
