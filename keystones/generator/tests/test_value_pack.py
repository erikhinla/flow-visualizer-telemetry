"""Value-pack behavior for the generator this app ships. Linux output is not a Mac or Windows acceptance."""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCRIPTS = os.path.join(ROOT, "pack_scripts")
GENERATE = os.path.join(ROOT, "generate.py")


def run(args, cwd=None, env=None):
    merged = os.environ.copy()
    merged.update(env or {})
    return subprocess.run([sys.executable] + args, cwd=cwd, env=merged, text=True, capture_output=True)


class ValuePackTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="ks-value-")
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def test_solo_owner_presets_plan_and_proof_carryover(self):
        intake = {
            "agency_name": "TransformBy10X",
            "departments": [{"name": "Owner", "lead": "Erik"}],
            "stages": ["Kickoff", "Production", "Review", "Delivery"],
            "rounds": [{"id": "R1", "name": "Erik review", "reviewers": ["Erik"], "business_affairs": False, "client_sees": False, "purpose": "Erik approves"}],
            "deliverables": ["Radio", "Print", "Experiential"],
            "storage": "a shared Drive",
            "version_style": "v1, v2, v3",
            "first_project": {"client": "TransformBy10X", "project": "Owner pack", "code": "TBTX-1", "due": "2026-12-01", "flight_start": "2026-12-01", "flight_end": "2026-12-31"},
        }
        intake_path = os.path.join(self.tmp, "intake.json")
        proof_path = os.path.join(self.tmp, "proof.json")
        out = os.path.join(self.tmp, "pack")
        with open(intake_path, "w", encoding="utf-8") as f:
            json.dump(intake, f)
        with open(proof_path, "w", encoding="utf-8") as f:
            json.dump({"agency_name": "TransformBy10X", "answers": {"q3": "q3-c2"}}, f)
        gen = run([GENERATE, "--intake", intake_path, "--proof", proof_path, "--out", out])
        self.assertEqual(gen.returncode, 0, gen.stderr + gen.stdout)
        plan = open(os.path.join(out, "IMPLEMENTATION-PLAN.md"), encoding="utf-8").read()
        self.assertIn("TransformBy10X", plan)
        self.assertIn("Erik", plan)
        self.assertIn("shared Drive", plan)
        self.assertIn("Record owner: Erik", plan)
        self.assertIn("A job title is used only when the intake names it.", plan)
        self.assertNotIn("Business Affairs Manager", plan)
        self.assertIn("not the recording", open(os.path.join(out, "WALKTHROUGH.md"), encoding="utf-8").read())
        project = next(os.path.join(out, "projects", name) for name in os.listdir(os.path.join(out, "projects")))
        for kind, folder in (("radio", "radio"), ("print", "print"), ("experiential", "experiential")):
            for stage in ("01_production", "03_delivery"):
                base = os.path.join(project, stage, folder)
                for name in ("specification.md", "rights-review.md", "review.md", "release.md"):
                    path = os.path.join(base, name)
                    self.assertTrue(os.path.isfile(path), path)
                    text = open(path, encoding="utf-8").read()
                    self.assertIn("unresolved", text.lower())
        context = open(os.path.join(project, "_context", "AI-CONTEXT.md"), encoding="utf-8").read()
        self.assertIn("spread across docs, decks and chats", context)
        preview = run([os.path.join(out, "scripts", "new_project.py"), "--pack", out, "--client", "Other", "--project", "Second", "--dry-run"])
        self.assertEqual(preview.returncode, 0, preview.stderr + preview.stdout)
        self.assertIn("Would create", preview.stdout)
        again = run([os.path.join(out, "scripts", "new_project.py"), "--pack", out, "--client", "TransformBy10X", "--project", "Owner pack", "--code", "TBTX-1"])
        self.assertNotEqual(again.returncode, 0)
        self.assertIn("already exists", again.stderr + again.stdout)

    def test_export_is_stable_and_does_not_announce(self):
        self.test_solo_owner_presets_plan_and_proof_carryover()
        project = next(os.path.join(self.tmp, "pack", "projects", name) for name in os.listdir(os.path.join(self.tmp, "pack", "projects")))
        log = os.path.join(project, "_context", "change-log.md")
        before = open(log, encoding="utf-8").read()
        script = os.path.join(self.tmp, "pack", "scripts", "export_update.py")
        first = run([script, "--project", project])
        second = run([script, "--project", project])
        self.assertEqual(first.returncode, 0, first.stderr + first.stdout)
        self.assertEqual(second.returncode, 0, second.stderr + second.stdout)
        self.assertIn("Not sent", first.stdout)
        self.assertEqual(before, open(log, encoding="utf-8").read())
        text = open(os.path.join(project, "_context", "exports", "changes.txt"), encoding="utf-8").read()
        self.assertIn("ID: ", text)
        self.assertIn("unresolved", text.lower())
        self.assertIn("revision 1", first.stdout)
        self.assertIn("revision 1", second.stdout)

    def test_renamed_column_is_a_visible_schema_error(self):
        self.test_solo_owner_presets_plan_and_proof_carryover()
        project = next(os.path.join(self.tmp, "pack", "projects", name) for name in os.listdir(os.path.join(self.tmp, "pack", "projects")))
        path = os.path.join(project, "_context", "change-log.md")
        text = open(path, encoding="utf-8").read().replace("| what changed |", "| renamed column |")
        open(path, "w", encoding="utf-8").write(text)
        result = run([os.path.join(self.tmp, "pack", "scripts", "round_agenda.py"), "--project", project])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SCHEMA", result.stderr + result.stdout)
        mand = os.path.join(project, "_context", "mandatories.md")
        broken = open(mand, encoding="utf-8").read().replace("current value", "wording now")
        open(mand, "w", encoding="utf-8").write(broken)
        sync = run([os.path.join(self.tmp, "pack", "scripts", "sync_mandatories.py"), "--project", project])
        self.assertNotEqual(sync.returncode, 0)
        self.assertIn("SCHEMA", sync.stdout + sync.stderr)
        self.assertNotIn("Everything is current", sync.stdout)

    def test_archive_conflict_and_approved_safeguard(self):
        self.test_solo_owner_presets_plan_and_proof_carryover()
        project = next(os.path.join(self.tmp, "pack", "projects", name) for name in os.listdir(os.path.join(self.tmp, "pack", "projects")))
        prod = os.path.join(project, "02_production", "radio")
        os.makedirs(prod, exist_ok=True)
        for name in ("Keep_v1.wav", "Keep_v2.wav", "Dup_v1.wav", "Dup-v1.wav", "Spot_FINAL.wav"):
            open(os.path.join(prod, name), "w", encoding="utf-8").write("audio")
        decisions = os.path.join(project, "_context", "decisions.md")
        with open(decisions, "a", encoding="utf-8") as f:
            f.write("| 2026-12-01 | Approved Keep_v1.wav for radio | Erik | R1 | radio | done |\n")
        result = run([os.path.join(self.tmp, "pack", "scripts", "archive_old_versions.py"), "--project", project, "--apply"])
        self.assertIn("SAFEGUARD", result.stdout)
        self.assertIn("CONFLICT", result.stdout)
        self.assertIn("CONFIRM", result.stdout)
        self.assertTrue(os.path.isfile(os.path.join(prod, "Keep_v1.wav")))
        self.assertTrue(os.path.isfile(os.path.join(prod, "Dup_v1.wav")))
        self.assertTrue(os.path.isfile(os.path.join(prod, "Spot_FINAL.wav")))

    def test_ambiguous_rights_need_review_and_native_files_are_not_edited(self):
        self.test_solo_owner_presets_plan_and_proof_carryover()
        project = next(os.path.join(self.tmp, "pack", "projects", name) for name in os.listdir(os.path.join(self.tmp, "pack", "projects")))
        rights = os.path.join(project, "_context", "rights-and-licenses.md")
        text = open(rights, encoding="utf-8").read()
        text = text.replace("| (example) Track name |", "| Voice | voiceover | studio | all linear and non-linear | US | 2026-12-01 | 2026-12-31 | see contract |\n| (example) Track name |", 1)
        open(rights, "w", encoding="utf-8").write(text)
        checked = run([os.path.join(self.tmp, "pack", "scripts", "rights_check.py"), "--project", project])
        self.assertNotEqual(checked.returncode, 0)
        self.assertIn("REVIEW", checked.stdout)
        self.assertIn("authorized review", checked.stdout)
        native = os.path.join(project, "02_production", "radio", "master.wav")
        os.makedirs(os.path.dirname(native), exist_ok=True)
        open(native, "wb").write(b"not-a-real-wav")
        before = open(native, "rb").read()
        synced = run([os.path.join(self.tmp, "pack", "scripts", "sync_mandatories.py"), "--project", project])
        self.assertEqual(synced.returncode, 0, synced.stderr + synced.stdout)
        self.assertIn("NOT EDITED", synced.stdout)
        self.assertEqual(before, open(native, "rb").read())

    def test_runtime_notice_and_one_sender(self):
        runtime = run([os.path.join(SCRIPTS, "check_runtime.py")])
        self.assertEqual(runtime.returncode, 0, runtime.stdout)
        self.assertIn("not a macOS or Windows acceptance", runtime.stdout)
        home = os.path.join(self.tmp, "home")
        os.makedirs(home)
        settings_dir = os.path.join(self.tmp, "settings-pack", "local-settings")
        os.makedirs(settings_dir)
        # Use the copied notify by generating a tiny project first.
        self.test_solo_owner_presets_plan_and_proof_carryover()
        project = next(os.path.join(self.tmp, "pack", "projects", name) for name in os.listdir(os.path.join(self.tmp, "pack", "projects")))
        settings = {
            "enabled": True,
            "email": {"host": "smtp.example.com", "from": "erik@transformby10x.ai", "port": 587, "security": "starttls", "password": "secret"},
            "addresses": {"Owner": "erik@transformby10x.ai"},
        }
        with open(os.path.join(self.tmp, "pack", "local-settings", "notices.json"), "w", encoding="utf-8") as f:
            json.dump(settings, f)
        with open(os.path.join(project, "_context", "change-log.md"), "a", encoding="utf-8") as f:
            f.write("| 2026-12-02 | CHANGE | Tagline updated | Erik | Owner | pending |\n")
        env = {"KEYSTONES_HOME": home, "KEYSTONES_NOTICES_MODE": "test", "KEYSTONES_SENDER_ID": "owner-mac"}
        blocked = run([os.path.join(self.tmp, "pack", "scripts", "notify.py"), "--project", project], env=env)
        self.assertIn("test mode refuses", blocked.stdout + blocked.stderr)
        self.assertNotIn("secret", blocked.stdout)
        env["KEYSTONES_SENDER_ID"] = "other-laptop"
        settings["email"]["host"] = "127.0.0.1"
        with open(os.path.join(self.tmp, "pack", "local-settings", "notices.json"), "w", encoding="utf-8") as f:
            json.dump(settings, f)
        other = run([os.path.join(self.tmp, "pack", "scripts", "notify.py"), "--project", project, "--preview"], env=env)
        self.assertIn("not the designated sender", other.stdout + other.stderr)
        packed = run([os.path.join(self.tmp, "pack", "scripts", "check_pack.py"), self.tmp + "/pack"])
        self.assertEqual(packed.returncode, 0, packed.stdout + packed.stderr)
        self.assertIn("does not validate macOS", packed.stdout)


if __name__ == "__main__":
    unittest.main()
