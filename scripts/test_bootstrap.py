#!/usr/bin/env python3
"""
Minimal unit tests for bootstrap_context.py, update_state.py, generate_handoff.py.
Run with: python scripts/test_bootstrap.py
"""

import unittest
import tempfile
import shutil
from pathlib import Path
import sys
import os
import yaml

# Ensure repo root is importable if needed
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import bootstrap_context
import check_boot_integrity


class TestBootstrapContext(unittest.TestCase):
    def setUp(self):
        self.original_root = bootstrap_context.REPO_ROOT

    def tearDown(self):
        bootstrap_context.REPO_ROOT = self.original_root

    def test_check_files_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            bootstrap_context.REPO_ROOT = Path(tmp)
            missing = bootstrap_context.check_files()
            # All required files should be reported missing
            self.assertEqual(len(missing), len(bootstrap_context.REQUIRED_FILES))

    def test_check_files_all_present(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bootstrap_context.REPO_ROOT = root
            for f in bootstrap_context.REQUIRED_FILES:
                p = root / f
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text("test", encoding="utf-8")
            missing = bootstrap_context.check_files()
            self.assertEqual(len(missing), 0)


class TestCheckBootIntegrity(unittest.TestCase):
    def test_main_on_real_repo(self):
        # This test assumes the repo is in a valid state
        code = check_boot_integrity.main()
        self.assertEqual(code, 0)


class TestYamlRoundTrip(unittest.TestCase):
    def test_yaml_preserve_keys(self):
        data = {
            "project": "Dragon-system",
            "version": "0.1.0",
            "phases": {
                "phase_0": {"status": "in_progress"}
            }
        }
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "test.yaml"
            with open(p, "w", encoding="utf-8") as f:
                yaml.dump(data, f, sort_keys=False, allow_unicode=True)
            with open(p, "r", encoding="utf-8") as f:
                loaded = yaml.safe_load(f)
            self.assertEqual(loaded["project"], "Dragon-system")
            self.assertEqual(loaded["phases"]["phase_0"]["status"], "in_progress")


if __name__ == "__main__":
    unittest.main()
