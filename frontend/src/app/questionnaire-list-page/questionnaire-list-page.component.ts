import { Component } from '@angular/core';
import { Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant'
import { QuestionnaireService } from '../services/questionnaire.service';
import { SelectItem } from 'primeng/api';


@Component({
  selector: 'mima-questionnaire-list-page',
  templateUrl: './questionnaire-list-page.component.html',
  styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent {
    public isLoading = false;
    selectedOption: string;
    questionnaire: Question[] = [];
    answers: Answer[] = [];
    participants: Participant[] = [];
    dialects: string[] = [];
    dropdownOptions = new Map<string, SelectItem[]>([
        ['question', []],
        ['dialect', []],
        ['participant', []],
    ]);
    selectedFilters: [];


    constructor(private questionnaireService: QuestionnaireService) {
    }

    ngOnInit() {
        this.isLoading = true;
        this.load();
        this.changeOption('question');
    }

    filterChange() {
        console.log(this.selectedFilters);
    }

    /**
     * loads the questionnaire and sets the variables accordingly.
     */
    private async load() {
        // this.questionnaire = [... await this.questionnaireService.get()]; //save output as an array, not yet applicable but soon
        this.questionnaire = await this.questionnaireService.get();
        this.answers = this.questionnaireService.convertToAnswers(this.questionnaire);
        this.participants = this.questionnaireService.getParticipants(this.answers);
        this.setDropdownOptions();
        this.isLoading = false
    }

    changeOption(option: string) {
        this.selectedOption = option;
    }

    /**
     * sets the options for the dropdown filter, currently with:
     * - the question IDs and prompts
     * - the dialects (sorted)
     * - the participant IDs and dialects
     */
    setDropdownOptions() {
        for (const question of this.questionnaire) {
            const item = question.id + ' ' + question.prompt;
            this.dropdownOptions.get('question').push({label: item, value: item});
        }

        for (const participant of this.participants) {
            const item = participant.participantId + ' ' + participant.dialect;
            this.dropdownOptions.get('participant').push({label: item, value: item});
            if (!this.dialects.includes(participant.dialect)) {
                this.dropdownOptions.get('dialect').push({label: participant.dialect, value: participant.dialect});
                this.dialects.push(participant.dialect);
            }
        }
        this.dropdownOptions.get('dialect').sort((a,b) => a.label < b.label ? -1 : 1)
    }
}
