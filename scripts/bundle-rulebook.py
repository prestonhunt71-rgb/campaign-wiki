from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
for name,source in [('campaign-wiki',root),('hero-rulebook',root/'modules/hero-rulebook')]:
    output=root/(name+'-standalone.zip')
    with ZipFile(output,'w',ZIP_DEFLATED) as bundle:
        for folder in ('scripts','styles','assets','data','lang','images'):
            for path in (source/folder).rglob('*'):
                if path.is_file() and '__pycache__' not in path.parts:
                    bundle.write(path,name+'/'+path.relative_to(source).as_posix())
        for filename in ('reader.html', 'README.md', 'CHAMPIONS_4E_RULES_INTERFACE_SPEC.md'):
            if (source/filename).is_file():
                bundle.write(source/filename,name+'/'+filename)
        manifest=json.loads((source/'module.json').read_text(encoding='utf-8'))
        if name=='campaign-wiki':manifest['version']='3.0.52-standalone.1'
        manifest.pop('manifest',None);manifest.pop('download',None)
        bundle.writestr(name+'/module.json',json.dumps(manifest,indent=2))
    print(output)
