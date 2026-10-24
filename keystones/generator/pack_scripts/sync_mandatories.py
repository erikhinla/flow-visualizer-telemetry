#!/usr/bin/env python3
"""
sync_mandatories.py : pull the current mandatories and legal lines into every file that uses them.

USAGE (from anywhere inside a project folder):
    python3 path/to/scripts/sync_mandatories.py            # preview the changes
    python3 path/to/scripts/sync_mandatories.py --apply    # write them and log to change-log.md
    Options: --project PATH, --also PATH (extra folder to scan, e.g. the pack's shared templates)

HOW TO MARK A PLACEHOLDER
    In any .md .txt .html .csv .json .srt .vtt file, write the key from mandatories.md or
    legal-lines.md:
        {{KS:legal.disclaimer}}                       first-time placeholder
    The first sync turns it into a marked block that stays updatable:
        [[KS:legal.disclaimer]]current text here[[/KS]]
    Every later sync replaces only the text between the marks. Keys come from the
    "key" column of the tables in mandatories.md and legal-lines.md.

WHAT IT LOGS
    One change-log.md row per key that changed, naming the files it touched, plus a warning
    for any placeholder whose key isn't in either file (so it's never left silently stale).
"""
import argparse, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ks_common import ctx, CONTEXT_DIR, find_project_root, key_values, read, write, append_change

EXTS = {".md", ".txt", ".html", ".csv", ".json", ".srt", ".vtt"}
SOURCE_FILES = {"mandatories.md", "legal-lines.md", "change-log.md", "decisions.md"}
BLOCK = re.compile(r"\[\[KS:(?P<key>[\w.\-]+)\]\](?P<val>.*?)\[\[/KS\]\]", re.S)
BARE = re.compile(r"\{\{KS:(?P<key>[\w.\-]+)\}\}")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Sync mandatories and legal lines into templates.")
    ap.add_argument("--project")
    ap.add_argument("--also", action="append", default=[])
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args(argv)
    root = find_project_root(a.project)

    values = {}
    for src in ("mandatories.md", "legal-lines.md"):
        p = ctx(root, src)
        if os.path.exists(p):
            values.update(key_values(p))
    print("Loaded %d keys from mandatories.md and legal-lines.md" % len(values))

    changed_keys, unknown = {}, {}
    scan = [root] + a.also
    for top in scan:
        for dirpath, dirnames, filenames in os.walk(top):
            dirnames[:] = [d for d in dirnames if d not in {"_archive", ".git"}]
            for fn in filenames:
                if os.path.splitext(fn)[1].lower() not in EXTS:
                    continue
                if dirpath == os.path.join(root, CONTEXT_DIR) and fn in SOURCE_FILES:
                    continue
                path = os.path.join(dirpath, fn)
                text = read(path)
                if "KS:" not in text:
                    continue
                rel = os.path.relpath(path, root)
                hits = []

                def block_sub(m):
                    k, old = m.group("key"), m.group("val")
                    if k not in values:
                        unknown.setdefault(k, set()).add(rel)
                        return m.group(0)
                    if old != values[k]:
                        hits.append((k, old, values[k]))
                    return "[[KS:%s]]%s[[/KS]]" % (k, values[k])

                def bare_sub(m):
                    k = m.group("key")
                    if k not in values:
                        unknown.setdefault(k, set()).add(rel)
                        return m.group(0)
                    hits.append((k, "(placeholder)", values[k]))
                    return "[[KS:%s]]%s[[/KS]]" % (k, values[k])

                new = BARE.sub(bare_sub, BLOCK.sub(block_sub, text))
                for k, old, val in hits:
                    print("%s %s  [%s]\n      was: %s\n      now: %s" % ("UPDATE" if a.apply else "WOULD UPDATE",
                                                                    rel, k, old, val))
                    changed_keys.setdefault(k, set()).add(rel)
                if hits and a.apply:
                    write(path, new)

    for k, files in sorted(unknown.items()):
        print("WARNING: placeholder key '%s' isn't in mandatories.md or legal-lines.md. Used in: %s"
              % (k, ", ".join(sorted(files))))

    if not changed_keys:
        print("Everything is current. No file needed changes.")
    elif a.apply:
        for k, files in sorted(changed_keys.items()):
            append_change(root, "SYNC", "`%s` pulled into %d file(s): %s" % (k, len(files), ", ".join(sorted(files))),
                          "sync_mandatories.py", "owners of those files", "pending")
        print("Updated %d key(s). Rows added to change-log.md." % len(changed_keys))
    else:
        print("Preview only. Run again with --apply to write %d key(s)." % len(changed_keys))
    return changed_keys, unknown


if __name__ == "__main__":
    main()
