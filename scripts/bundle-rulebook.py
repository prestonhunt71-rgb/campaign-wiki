from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
output = root / 'campaign-wiki-rulebook.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as bundle:
    for folder in ('scripts', 'styles', 'assets', 'data', 'lang'):
        for source in (root / folder).rglob('*'):
            if source.is_file() and '__pycache__' not in source.parts:
                bundle.write(source, 'campaign-wiki/' + source.relative_to(root).as_posix())
    manifest = json.loads((root / 'module.json').read_text(encoding='utf-8'))
    manifest['version'] = '3.0.52-rulebook.3'
    manifest.pop('manifest', None)
    manifest.pop('download', None)
    bundle.writestr('campaign-wiki/module.json', json.dumps(manifest, indent=2))
print(output)
