import csv
import re
import editdistance

class Question():
    def __init__(self, tag, index, question, type='NA', prompt='NA', cleaned=False, answers=None):
        self.tag = tag
        self.index = index
        self.question = question
        self.type = type
        self.prompt = prompt
        self.cleaned = cleaned
        self.answers = answers

    def __str__(self) -> str:
        return('Question {}: {}'.format(self.tag, self.question))

class Answer:
    def __init__(self, tag, prompt, answer, dialect, ma='NA', prompt_ma='NA'):
        self.tag = tag
        self.prompt = prompt
        self.answer = answer
        self.dialect = dialect
        self.ma = ma
        self.prompt_ma = prompt_ma

class Dialect():
    def __init__(self, dialect, n_speakers = 0, translations={}):
        self.dialect = dialect
        self.n_speakers = n_speakers
        self.translations = translations


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

new_data_path = "/Users/Stiph002/Projects/mima_materials/prefinal_data/cleaned_data_meertens_panel.csv"
new_data = read_csv(new_data_path)

participants_path = "/Users/Stiph002/Projects/mima_materials/prelim_cleaned/deelnemers.csv"
participants_data = read_csv(participants_path)

## Match dialects to participant IDs
participants = {}

for participant in participants_data[1:]:
    if participant[29] == 'Het dialect van …':
        dialect = ' '.join(participant[29:31])
    elif participant[29] == '':
        dialect = 'Geen Dialect'
    else:
        dialect = participant[29]
    participants[''.join(participant[0:2])] = dialect

## Create a Question for each question and save it as an instance
q_items = {} #keys: question tags, e.g. V1Z1b[SQ001_SQ001]., values: Questions

for index, cell in enumerate(new_data[0]):
    first_word = cell.split()[0]
    if first_word == 'CLEANED':
        questionnaire_item = Question(
            tag = cell.split()[1],
            index = index,
            question = remove_periods(' '.join(cell.split()[2:])),
            type = 'Translation',
            cleaned = True
        )
    elif cell.endswith('[Vertaling]') and first_word not in ['COMMENT', 'DEVIATION']:
        questionnaire_item = Question(
            tag = first_word,
            index = index,
            question = remove_periods(' '.join(cell.split()[1:])),
            type = 'Translation'
        )
    else:
        questionnaire_item = Question(
            tag = first_word,
            index = index,
            question = remove_periods(' '.join(cell.split()[1:]))
        )

    q_items[questionnaire_item.index] = questionnaire_item

## Find the translations in the questionnaire
## Save the indices of those questions
translation_indices = []  # indices of translation questions
for item in q_items:
    if q_items[item].type == 'Translation':
        translation_indices.append(q_items[item].index)

print('N of questions: {}\nN of translation questions: {}'.format(len(q_items), len(translation_indices)))

prompt_pattern = r'\[(.*?)\]'
for ti in translation_indices:
    match = re.search(prompt_pattern, q_items[ti].question)
    if match:
        q_items[ti].prompt = match.group(1)
    else:
        q_items[ti].prompt = 'No prompt found'

## Fill the answers for each question
for row in new_data[1:]:
    participant = ''.join(row[0:2])
    for index, cell in enumerate(row):
        if cell != '' and index in translation_indices:
            if q_items[index+1].cleaned and row[index+1] != '':
                pass
            else:
                if '|' not in cell:
                    answer = [(participant, cell)]
                else:
                    answer = [(participant, translation) for translation in cell.split('| ')]

                if q_items[index].answers:
                    q_items[index].answers += answer
                else:
                    q_items[index].answers = answer

## Collect the translations
translations = []

for index in q_items:
    item = q_items[index]
    if item.type != 'Translation':
        pass
    else:
        tag = item.tag
        prompt = item.prompt
        if item.answers:
            for answer in item.answers:
                translation = Answer(remove_periods(tag), remove_periods(prompt), remove_periods(answer[1]), participants[answer[0]])
                translations.append(translation)


## Detect the Manner Adverbials in each translation
## Get MA positions from prompts
prompt_pos = read_csv("/Users/Stiph002/Projects/mima_materials/prelim_cleaned/ma_positions.csv")

## fill a dict with prompt (row[1]) and position (row[2])
ma_positions = {}
for row in prompt_pos[1:]:
    if ':' in row[2]:
        start = int(row[2].split(':')[0])
        end = int(row[2].split(':')[1])
        ma_positions[remove_periods(row[1].strip())] = (start, end)
    else:
        ma_positions[remove_periods(row[1].strip())] = int(row[2])


## Use MA positions to get MAs from answer
## then check the edit distance for a better match
## evaluate better match
for entry in translations:
    # first, position:
    ma_position = ma_positions[entry.prompt]
    try:
        if type(ma_position) == int:
            ma = entry.answer.split()[ma_position]
            entry.ma = ma
            prompt_ma = entry.prompt.split()[ma_position]
            entry.prompt_ma = prompt_ma
        else:
            ma = entry.answer.split()[ma_position[0]:ma_position[1]]
            entry.ma = ' '.join(ma)
            prompt_ma = ' '.join(entry.prompt.split()[ma_position[0]:ma_position[1]])
            entry.prompt_ma = prompt_ma
    except:
        prompt_ma = 'NA'
        pass #for the fucking idem answers

    # second, edit distance:
    ed_to_beat = editdistance.distance(entry.ma, prompt_ma)
    if type(ma_position) == int:
        for word in entry.answer.split():
            ed = editdistance.distance(word, prompt_ma)
            if ed < ed_to_beat:
                entry.ma = [ma, word]
                ed_to_beat = ed
    else:
        len_ma = ma_position[1]-ma_position[0] #len of ma window, (2:4) = 2-word window
        for i in range(len(entry.answer.split())-len_ma):
            ed = editdistance.distance(' '.join(entry.answer.split()[i:i+len_ma]), prompt_ma)
            if ed < ed_to_beat:
                entry.ma = [' '.join(ma), ' '.join(entry.answer.split()[i:i+len_ma])]
                ed_to_beat = ed


## Create a file with prompt MAs and their translations.
prompt_translation_mas = {}
for tr in translations:
    if type(tr.ma) == str:
        if tr.prompt_ma in prompt_translation_mas:
            if tr.ma not in prompt_translation_mas[tr.prompt_ma]:
                prompt_translation_mas[tr.prompt_ma].append(tr.ma)
        else:
            prompt_translation_mas[tr.prompt_ma] = [tr.ma]
    else:
        ## TODO: make a decision on what to do with MAs that have several candidates
        ## Now it simply takes the first one
        if tr.prompt_ma in prompt_translation_mas:
            if tr.ma[0] not in prompt_translation_mas[tr.prompt_ma]:
                prompt_translation_mas[tr.prompt_ma].append(tr.ma[0])
        else:
            prompt_translation_mas[tr.prompt_ma] = [tr.ma[0]]

## Temporary file to show to team

# filename = '/Users/Stiph002/Projects/mima_materials/trans_per_ma.csv'
# with open(filename, 'w', newline='', encoding='utf8') as file:
#     writer = csv.writer(file)
#     for ptm in prompt_translation_mas:
#         line = [ptm] + [tr for tr in prompt_translation_mas[ptm]]
#         writer.writerow(line)
class IDs():
    def __init__(self, existing_ids=None):
        self.existing_ids = set(existing_ids) if existing_ids else set()
        self.counter = 1

    def generate_id(self):
        while True:
            new_id = f"Q-{self.counter}"
            self.counter += 1
            if new_id not in self.existing_ids:
                self.existing_ids.add(new_id)
                return new_id


existing_ids = []
id_generator = IDs(existing_ids)


class Adverbial:
    def __init__(self, answer):
        self.id = id_generator.generate_id()
        self.text = answer.ma
        self.roots = [answer.prompt_ma]
        self.examples = [answer.answer]
        self.translations = [answer.prompt]
        self.glosses = []
        self.language = 'Dutch'
        self.dialect = answer.dialect
        self.language_family = 'Indo-European'
        self.language_group = 'Germanic'
        self.source = 'Questionnaire'
        self.labels = []
        self.notes = ''
        ## Temporary bit of code that picks the first candidate for MA if two are identified by the read_data script
        if type(answer.ma) == list:
            self.text = answer.ma[0]

## Fill the adverbials dict with all translated examples
adverbials = {}
for answer in translations:
    key = str([answer.ma, answer.dialect])
    if key in adverbials.keys():
        adverbials[key].examples.append(answer.answer)
        adverbials[key].translations.append(answer.prompt)
        if answer.prompt_ma not in adverbials[key].roots:
            adverbials[key].roots.append(answer.prompt_ma)
    else:
        new_adverbial = Adverbial(answer)
        adverbials[key] = new_adverbial

print('Adverbials:', len(adverbials))

import json

adverbials_list = [adverbial for adverbial in adverbials.values()]

# Convert the list of Adverbial objects to JSON
def obj_dict(obj):
    return obj.__dict__

json_data = json.dumps(adverbials_list, default=obj_dict, indent=2)
json_data_abridged = json.dumps(adverbials_list[0:50], default=obj_dict, indent=2)


# Write the JSON data to a file
with open('/Users/Stiph002/Projects/mima_materials/adverbials_questionnaire.json', 'w') as json_file:
    json_file.write(json_data)

with open('/Users/Stiph002/Projects/mima_materials/adverbials_questionnaire_abridged.json', 'w') as json_file:
    json_file.write(json_data_abridged)


# write a csv file to manually check for the correct MA: for Tess
with open('/Users/Stiph002/Projects/mima_materials/list_MAs_to_check', 'w') as file:
    writer = csv.writer(file)
    for adverbial in adverbials_list:
        row = [adverbial.id, adverbial.examples[0], adverbial.text, '']
        writer.writerow(row)


