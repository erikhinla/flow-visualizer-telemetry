# Mac and Windows acceptance

These runs are still pending. A Linux shell, including one that executes `Start Keystones (Mac).command` under bash, is not a Mac launch and is not a Windows launch.

Use the pack that was actually downloaded from production. Do the file changes in a copy that can be thrown away.

## Record for every run

Operating system and version, machine, the account's permission, where the zip was downloaded, filename, sha256, Python version, the folder path, date and Pacific time, who ran it, what happened, and who owns any defect.

## On the pack, any computer

```bash
python3 scripts/check_runtime.py
python3 scripts/check_pack.py
```

`check_runtime.py` prints whether this process is a Mac or Windows acceptance. On Linux it says it is not. `check_pack.py` checks the zip or the unpacked folder for the launchers, the generator scripts, and that notices settings are not required to be inside the zip. It does not start a GUI.

## Mac, still required

Download the zip in Safari or Finder and unzip it the usual way. Open `Start Keystones (Mac).command` with right-click, then Open, if Gatekeeper asks. Note whether the executable bit survived the unzip. Run the menu from a path that contains a space and an accent. Preview a project, apply it, and confirm a second run refuses to overwrite. Preview and apply an archive on copies. Export an update and do not send it. Start watch, stop it, and note sleep or a dropped network only if you can actually do that.

## Windows, still required

Same checks with `Start Keystones (Windows).bat`, the `py` launcher, a console that can show an accented name, a reserved filename, and a long path. A virtual machine is extra evidence. It is not a physical Windows laptop unless Erik accepts that substitute.

## Notices

Leave notices off. If they are turned on, the password belongs in `KEYSTONES_MAIL_PASSWORD` or the system keychain, not in a Drive-synced `notices.json`. The first computer to send becomes the designated sender in `~/.config/keystones/` (or `KEYSTONES_HOME`). Another computer must refuse. Do not point a test at a real mail host. `KEYSTONES_NOTICES_MODE=test` refuses any host that is not localhost.
