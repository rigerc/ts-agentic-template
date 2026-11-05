#!/usr/bin/env python3
"""Standard-library test suite for the optional triage helper."""

from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "triage.py"


def item(code, severity="error", line=3, message="problem", filename="src/a.ts"):
    return {
        "code": code,
        "severity": severity,
        "message": message,
        "filename": filename,
        "labels": [{"span": {"line": line, "column": 5}}],
    }


class TriageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def write(self, name, diagnostics, count=4):
        path = self.root / name
        path.write_text(json.dumps({"diagnostics": diagnostics, "number_of_files": count}), encoding="utf-8")
        return path

    def run_script(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], capture_output=True, text=True)

    def test_filters_rules_and_counts_warnings(self):
        report = self.write("r.json", [item("anti-slop(no-array-filter-map)"),
                                       item("anti-slop-effect/prefer-effect-match", "warning"),
                                       item("oxc(no-accumulating-spread)"),
                                       item("eslint(no-debugger)")])
        result = self.run_script(report, "--output", "json")
        self.assertEqual(result.returncode, 0, result.stderr)
        body = json.loads(result.stdout)
        self.assertEqual((body["total"], body["errors"], body["warnings"]), (3, 2, 1))
        self.assertIn("oxc/no-accumulating-spread", body["rules"])
        self.assertIn("anti-slop/no-array-filter-map", body["rules"])
        self.assertNotIn("eslint(no-debugger)", body["rules"])

    def test_include_all(self):
        report = self.write("r.json", [item("eslint(no-debugger)")])
        result = self.run_script(report, "--include-all", "--output", "json")
        self.assertEqual(json.loads(result.stdout)["total"], 1)

    def test_baseline_line_moves_are_not_new(self):
        old = self.write("old.json", [item("anti-slop/no-array-filter-map", line=10)])
        new = self.write("new.json", [item("anti-slop(no-array-filter-map)", line=31)])
        result = self.run_script(new, "--baseline", old, "--output", "json")
        body = json.loads(result.stdout)
        self.assertEqual(body["comparison"]["resolved"], 0)
        self.assertEqual(body["comparison"]["introduced"], 0)

    def test_baseline_counts_resolved_and_introduced(self):
        old = self.write("old.json", [item("anti-slop/no-runtime-typeof", message="A")])
        new = self.write("new.json", [item("anti-slop/no-unknown-parameters", message="B")])
        result = self.run_script(new, "--baseline", old, "--output", "json")
        body = json.loads(result.stdout)
        self.assertEqual(body["comparison"]["resolved"], 1)
        self.assertEqual(body["comparison"]["introduced"], 1)

    def test_malformed_json_is_failure(self):
        path = self.root / "bad.json"
        path.write_text("failed to load plugin\n", encoding="utf-8")
        result = self.run_script(path)
        self.assertEqual(result.returncode, 2)
        self.assertIn("ERROR:", result.stderr)

    def test_empty_scope_is_flagged(self):
        report = self.write("empty.json", [], count=0)
        result = self.run_script(report)
        self.assertEqual(result.returncode, 0)
        self.assertIn("zero linted files", result.stdout)


if __name__ == "__main__":
    unittest.main()
