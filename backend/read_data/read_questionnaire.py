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
    # Create a translation table mapping periods to None
    translator = str.maketrans('', '', '.')
    # Remove periods using translation table
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
    ma: str = 'NA'
    prompt: str = "NA"
    prompt_ma: str = 'NA'

@dataclass
class Dialect:
    dialect: str
    speakers: list = None
    translations: dict = None

data = read_csv(DATA_PATH)
participants_data = read_csv(PARTICIPANTS_PATH)
additional_data = read_csv(ADDITIONAL_DATA_PATH)

## Match dialects to participant IDs
participants = {}
for participant in participants_data[1:]:
    separators = [';', '&', '+']
    pattern = '|'.join(map(re.escape, separators))
    dialect = [subdialect.strip() for subdialect in re.split(pattern, participant[32])]
    participants[''.join(participant[0:2])] = dialect

## Create a Question for each question and save it as an instance
questionnaire_items = {} #keys: question index
for index, cell in enumerate(data[0]):
    first_word = cell.split()[0]
    if first_word == 'CLEANED':
        questionnaire_item = Question(
            tag = remove_periods(cell.split()[1]),
            index = index,
            question = remove_periods(' '.join(cell.split()[2:])),
            type = 'Translation',
            cleaned = True
        )
    elif cell.endswith('[Vertaling]') and first_word not in ['COMMENT', 'DEVIATION']:
        questionnaire_item = Question(
            tag = remove_periods(first_word),
            index = index,
            question = remove_periods(' '.join(cell.split()[1:])),
            type = 'Translation'
        )
    else:
        questionnaire_item = Question(
            tag = remove_periods(first_word),
            index = index,
            question = remove_periods(' '.join(cell.split()[1:]))
        )

    questionnaire_items[questionnaire_item.index] = questionnaire_item

## Find the translations in the questionnaire
## Save the indices of those questions
translation_indices = []  # indices of translation questions
for item in questionnaire_items:
    if questionnaire_items[item].type == 'Translation':
        translation_indices.append(questionnaire_items[item].index)
print('N of questions: {}\nN of translation questions: {}'.format(len(questionnaire_items), len(translation_indices)))

## Collect the prompts for the translation questions
prompt_pattern = r'\[(.*?)\]'
for ti in translation_indices:
    match = re.search(prompt_pattern, questionnaire_items[ti].question)
    if match:
        questionnaire_items[ti].prompt = match.group(1)
    else:
        questionnaire_items[ti].prompt = 'No prompt found'

## Fill the answers for each question
for row in data[1:]:
    participant = ''.join(row[0:2])
    for index, cell in enumerate(row):
        question = questionnaire_items[index]
        if index in translation_indices:
            # mark unattested answers for empty cells
            # cleaned cells are skipped
            if cell == '' and not questionnaire_items[index].cleaned:
                answer = Answer(question.tag, answer='unattested', dialect=participants[participant], participant_id=participant)
                if question.answers:
                    question.answers.append(answer)
                else:
                    question.answers = [answer]
            elif cell != '':
                # skip cells that have cleaned versions of them in the next line
                if questionnaire_items[index+1].cleaned and row[index+1] != '':
                    pass
                else:
                    answer = Answer(question.tag, answer=cell, dialect=participants[participant], participant_id=participant)
                    if question.answers:
                        question.answers.append(answer)
                    else:
                        question.answers = [answer]

## Merge all the answers from the cleaned and uncleaned translation questions under a single cleaned translation question
## and save it in a cleaned_translation_questions_dict
cleaned_translation_questions = {} ## dict where the keys are the question tag (e.g. 'D7Z3[SQ004]')
for index in questionnaire_items:
    question = questionnaire_items[index]
    if question.answers and question.type == 'Translation' and not question.cleaned:
        if questionnaire_items[index+1].cleaned:
            if questionnaire_items[index+1].answers:
                questionnaire_items[index+1].answers += question.answers
            else:
                questionnaire_items[index+1].answers = question.answers
        else: #if there is no CLEANED column, the answers of this question are added
            cleaned_translation_questions[question.tag] = question
    if question.cleaned:
        cleaned_translation_questions[question.tag] = question


## Go through the additional data and attach the necessary information to the cleaned_translation_questions
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


# Define a custom function to serialize data classes as dictionaries
def serialize_classes(obj):
    if isinstance(obj, Question) or isinstance(obj, Answer):
        return asdict(obj)
    return obj.__dict__

## dump as json
with open(os.path.join(OUTPUT_PATH, 'cleaned_translation_questions.json'), 'w') as file:
    json.dump(cleaned_translation_questions, file, default=serialize_classes, indent=4)

