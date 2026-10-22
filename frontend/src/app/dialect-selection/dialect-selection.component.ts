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
    selected?: string[];
    nodeLabels?: { [name: string]: string }

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
        }

        if (this.nodes && changes.content) {
            this.setContent(this.nodes, this.content);
            this.selected = this.selectedNodes(this.nodes);
        }
    }

    selectNode(node: DialectNode, value: boolean) {
        if (this.nodes) {
            node.selected = value;
            node.indeterminate = false;
            this.setChildren(node);
            if (node.parents.length) {
                const root = node.parents[0];
                this.checkValue(root);
            }
            this.selected = this.selectedNodes(this.nodes);
            this.outputContent();
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
            this.setValueFromChildren(node);
        }
    }

    private setValueFromChildren(node: DialectNode) {
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

    private outputContent() {
        if (this.selected) {
            this.contentChange.emit(this.selected);
        }
    }

    private selectedNodes(nodes: DialectNode[]): string[] {
        return nodes.flatMap(node => {
            if (node.selected) {
                return [node.data.name];
            } else {
                return this.selectedNodes(node.children);
            }
        });
    }

    private setContent(nodes: DialectNode[], value: string[]): void {
        for (let node of nodes) {
            if (value.includes(node.data.name)) {
                node.selected = true;
                node.indeterminate = false;
                this.setChildren(node);
            } else if (node.children.length) {
                this.setContent(node.children, value);
                this.setValueFromChildren(node);
            } else {
                node.selected = false;
                node.indeterminate = false;
            }
        }
    }

    private fillNodes(name: FilterObjectName) {
        const lookup = this.dialectService.getDialectLookup(name);
        this.nodes = this.parseNodes(lookup.root, []);
        this.nodeLabels = {};
        this.addLabels(this.nodes, this.nodeLabels);
        this.dataSource.data = this.nodes;
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

    private addLabels(nodes: DialectNode[], labels: Record<string, string>) {
        for (let node of nodes) {
            labels[node.data.name] = node.data.label;
            this.addLabels(node.children, labels);
        }
    }
}
