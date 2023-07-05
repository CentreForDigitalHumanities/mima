from distutils.command.upload import upload
from django.db import models
from typing import Callable, Dict, List, Sequence, Tuple


def str_map(x: str):
    return x

def lst_map(x: str):
    if type(x) == list:
        return x
    else :
        return [x]


def label_map(x):
    if type(x) == str:
        return x.split('+')
    else:
        return lst_map(x)


adverbial_mapping: Dict[str, Tuple[str, Callable[[str], any]]] = {
    'id': ('id', str_map),
    'text': ('text', str_map),
    'roots': ('roots', lst_map),
    'examples': ('examples', lst_map),
    'translations': ('translations', lst_map),
    'glosses': ('glosses', lst_map),
    'language': ('language', str_map),
    'dialect': ('dialect', str_map),
    'language_family': ('language_family', str_map),
    'language_group': ('language_group', str_map),
    'source': ('source', str_map),
    'labels': ('labels', label_map),
    'notes': ('notes', str_map)
}


class Adverbial:
    @staticmethod
    def validate_fieldnames(fieldnames: Sequence[str]) -> List[str]:
        errors: List[List[str]] = []
        missing_columns = list(adverbial_mapping.keys())
        for name in fieldnames:
            name = name.replace('\ufeff', '')  # remove ufeff byte from microsoft excel files

            if name not in adverbial_mapping:
                errors.append(['UNKNOWN_COLUMN', name])
            else:
                missing_columns.remove(name)

        for name in missing_columns:
            errors.append(['MISSING_COLUMN', name])

        return errors

    @staticmethod
    def from_csv_row(row: Dict[str, str]) -> 'Adverbial':
        adverbial = Adverbial()
        for key, value in row.items():
            key = key.replace('\ufeff', '')  # remove ufeff byte from microsoft excel files
            name, mapping = adverbial_mapping[key]
            setattr(adverbial, name, mapping(value))

        return adverbial

    def as_dict(self) -> Dict[str, any]:
        result: Dict[str, any] = {}
        for _, (key, _) in adverbial_mapping.items():
            result[key] = getattr(self, key)

        return result
