import { Component, OnInit } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { AdverbialsService } from '../services/adverbials.service';

@Component({
    selector: 'mima-adverbial-list-page',
    templateUrl: './adverbial-list-page.component.html',
    styleUrls: ['./adverbial-list-page.component.scss']
})
export class AdverbialListPageComponent implements OnInit {
    adverbials: Adverbial[];

    constructor(private adverbialService: AdverbialsService) { }

    async ngOnInit(): Promise<void> {
        this.adverbials = Array.from(await this.adverbialService.get());
    }

}
