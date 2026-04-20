from pathlib import Path
import re
root = Path('backend/app')
pattern = re.compile(r'^(from|import)\s+app(\.|\b)(.*)')
changed_files = []
for path in root.rglob('*.py'):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    new_lines = []
    modified = False
    current_pkg = path.relative_to(root).parent.parts
    for line in lines:
        stripped = line.lstrip()
        indent = line[:len(line)-len(stripped)]
        m = pattern.match(stripped)
        if not m:
            new_lines.append(line)
            continue
        kind, sep, rest = m.groups()
        if kind == 'import':
            if sep != '.':
                new_lines.append(line)
                continue
            target = rest.strip()
            mod_parts = target.split('.') if target else []
            if mod_parts and mod_parts[0] == 'app':
                mod_parts = mod_parts[1:]
            common = []
            for a, b in zip(current_pkg, mod_parts):
                if a == b:
                    common.append(a)
                else:
                    break
            up = len(current_pkg) - len(common)
            prefix = '.' * (up + 1)
            down = mod_parts[len(common):]
            new_import = prefix + ('.' + '.'.join(down) if down else '')
            new_lines.append(indent + 'import ' + new_import)
            modified = True
            continue
        target = rest.strip()
        if ' import ' not in target:
            new_lines.append(line)
            continue
        mod, imp = target.split(' import ', 1)
        mod_parts = mod.split('.') if mod else []
        if mod_parts and mod_parts[0] == 'app':
            mod_parts = mod_parts[1:]
        common = []
        for a, b in zip(current_pkg, mod_parts):
            if a == b:
                common.append(a)
            else:
                break
        up = len(current_pkg) - len(common)
        prefix = '.' * (up + 1)
        down = mod_parts[len(common):]
        modpath = prefix + ('.' + '.'.join(down) if down else '')
        new_lines.append(indent + f'from {modpath} import {imp}')
        modified = True
    if modified:
        path.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
        changed_files.append(str(path))
print('changed files:')
for f in changed_files:
    print(f)
