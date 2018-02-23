from pathlib import Path
from configparser import ConfigParser
import json

old = Path('locale')
new = Path('_locales')

class FakeSecHead:
    def __init__(self, fp):
        self.fp = fp
        self.sechead = '[dummy]\n'

    def __iter__(self):
        return self

    def __next__(self):
        if self.sechead:
            try: 
                return self.sechead
            finally: 
                self.sechead = None
        else:
            return next(self.fp)

for x in old.iterdir():
    messages = {}
    config = ConfigParser(interpolation=None)
    config.read_file(FakeSecHead(open(x, encoding='utf-8')))
    for key, value in config['dummy'].items():
        messages[key] = {'message': value, 'description': ""}
    messages_path = new / x.stem / 'messages.json'
    with messages_path.open('w', encoding='utf-8') as kf:
        json.dump(messages, kf, ensure_ascii=False)
