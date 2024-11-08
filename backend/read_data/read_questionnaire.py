import csv
import re
import json
import os
from dataclasses import dataclass, asdict

from mima.settings import DATA_PATH, ADDITIONAL_DATA_PATH, PARTICIPANTS_PATH, OUTPUT_PATH

def read_csv(filepath):
    data = []
    with open(filepath, encoding='utf8') as file:
        reader = csv.reader(file)
        for index, row in enumerate(reader):
            data.append(row)
    return data

def remove_periods(text):
    translator = str.maketrans('', '', '.')
    stripped_text = text.translate(translator)
    return stripped_text

@dataclass
class Question:
    tag: str
    index: int
    question: str
    type: str = 'NA'
    prompt: str = 'NA'
    cleaned: bool = False
    split_item: str = 'NA'  # same as the question but split morphologically with punctuation
    chapter: str = 'NA'
    subtags: list = None
    en_translation: str = 'NA'
    gloss: str = 'NA'
    answers: list = None


    def __str__(self) -> str:
        return 'Question {}: {}'.format(self.tag, self.question)

@dataclass
class Answer:
    tag: str
    answer: str
    dialect: str
    participant_id: str

@dataclass
class Dialect:
    dialect: str
    speakers: list = None
    translations: dict = None

def match_ids_to_dialects(participants_data):
    """
    Matches dialects to participant IDs based on the provided participants data.

    Args:
        participants_data (list): A list of participant data from the csv file.

    Returns:
        participant_dialect_dict (dict): A dictionary mapping participant IDs to their corresponding dialects.
    """
    participant_dialect_dict = {}
    for participant in participants_data[1:]:
        if participant[29] == 'Het dialect van …':
            dialect = ' '.join(participant[29:31])
        elif participant[29] == '':
            dialect = 'Geen Dialect'
        else:
            dialect = participant[29]
        participant_dialect_dict[''.join(participant[0:2])] = dialect
    return participant_dialect_dict

def get_prompt(question: str):
    prompt_pattern = r'\[(.*?)\]'
    match = re.search(prompt_pattern, question)
    if match:
        return match.group(1)
    else:
        return 'No prompt found'


def extract_questions(headers_row):
    """
    Reads a questionnaire from a file and creates a Question object for each question.
    Each Question object is stored as a value in a dictionary where the key is the question index.

    Note: a cell can have CLEAN, DEVIATION, or COMMENT as a special first word.

    Args:
        headers_row (list): A list of lines from the questionnaire csv that should contain a head

    Returns:
        questionnaire_dict (dict[str, Question]): A dictionary where the keys are question indices and the values are Question objects.
    """
    questionnaire_dict = {}

    for index, cell in enumerate(headers_row):
        first_word = cell.split()[0]
        if first_word == 'CLEANED':
            questionnaire_item = Question(
                tag = remove_periods(cell.split()[1]),
                index = index,
                question = remove_periods(' '.join(cell.split()[2:])),
                type = 'translation',
                cleaned = True
            )
            questionnaire_item.prompt = get_prompt(questionnaire_item.question)
        elif cell.endswith('[Vertaling]') and first_word not in ['COMMENT', 'DEVIATION']:
            questionnaire_item = Question(
                tag = remove_periods(first_word),
                index = index,
                question = remove_periods(' '.join(cell.split()[1:])),
                type = 'translation'
            )
            questionnaire_item.prompt = get_prompt(questionnaire_item.question)
        else:
            questionnaire_item = Question(
                tag = remove_periods(first_word),
                index = index,
                question = remove_periods(' '.join(cell.split()[1:]))
            )
        ## add Question object to the dict
        questionnaire_dict[questionnaire_item.index] = questionnaire_item

    return questionnaire_dict

def extract_answers(questionnaire_data: list, questionnaire_dict: dict, participant_dialect_dict: dict):
    ## Fill the answers for each question
    for row in questionnaire_data[1:]:
        participant = ''.join(row[0:2])
        for index, cell in enumerate(row):
            question = questionnaire_dict[index]
            if question.type == 'translation':
                # mark unattested answers for empty cells
                # empty cleaned cells are skipped
                if cell == '' and not questionnaire_dict[index].cleaned:
                    answer = Answer(question.tag, answer='unattested', dialect=participant_dialect_dict[participant], participant_id=participant)
                    if question.answers:
                        question.answers.append(answer)
                    else:
                        question.answers = [answer]
                elif cell != '':
                    # skip cells that have cleaned versions of them in the next line
                    if questionnaire_dict[index+1].cleaned and row[index+1] != '':
                        pass
                    else:
                        answer = Answer(question.tag, answer=cell, dialect=participant_dialect_dict[participant], participant_id=participant)
                        if question.answers:
                            question.answers.append(answer)
                        else:
                            question.answers = [answer]


        ## Merge all the answers from the cleaned and uncleaned translation questions under a single cleaned translation question
        ## and save it in a cleaned_translation_questions_dict
    cleaned_translation_questions = {} ## dict where the keys are the question tag (e.g. 'D7Z3[SQ004]')
    for index in questionnaire_dict:
        question = questionnaire_dict[index]
        if question.answers and question.type == 'translation' and not question.cleaned:
            if questionnaire_dict[index+1].cleaned:
                if questionnaire_dict[index+1].answers:
                    questionnaire_dict[index+1].answers += question.answers
                else:
                    questionnaire_dict[index+1].answers = question.answers
            else: #if there is no CLEANED column, the answers of this question are added
                cleaned_translation_questions[question.tag] = question
        if question.cleaned:
            cleaned_translation_questions[question.tag] = question

    return cleaned_translation_questions

def complement_questionnaire_with_additional_data(cleaned_translation_questions: dict, additional_data: list):
    ## Go through the additional data of chapters, subtags, etc.
    ## and attach the necessary information to the cleaned_translation_questions
    for entry in additional_data[1:]:
        ids = entry[0].split(';')
        split_item = entry[1]
        chapter = entry[2]
        subtags = entry[3].split(';')
        en_translation = entry[4]
        gloss = entry[5]
        for id in ids:
            try:
                question = cleaned_translation_questions[id]
                question.split_item = split_item
                question.chapter = chapter
                question.subtags = subtags
                question.en_translation = en_translation
                question.gloss = gloss
            except:
                pass

    return cleaned_translation_questions

def generate_questionnaire_dict(data_path, participants_path, additional_data_path):
    questionnaire_data = read_csv(data_path)
    participants_data = read_csv(participants_path)
    additional_data = read_csv(additional_data_path)
    questionnaire_dict = extract_questions(questionnaire_data[0])
    participant_dialect_dict = match_ids_to_dialects(participants_data)
    cleaned_translation_questions = extract_answers(questionnaire_data, questionnaire_dict, participant_dialect_dict)
    cleaned_translation_questions = complement_questionnaire_with_additional_data(cleaned_translation_questions, additional_data)
    return cleaned_translation_questions

# Define a custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, Question) or isinstance(obj, Answer):
        return asdict(obj)
    return obj.__dict__

def main():
    ## Read data files
    cleaned_translation_questions_meertens_1 = generate_questionnaire_dict(DATA_PATH, PARTICIPANTS_PATH, ADDITIONAL_DATA_PATH)
    ## dump as json
    with open(os.path.join(OUTPUT_PATH, 'cleaned_translation_questions.json'), 'w') as file:
        json.dump(cleaned_translation_questions_meertens_1, file, default=serialize_classes, indent=4)

if __name__ == "__main__":
    main()

