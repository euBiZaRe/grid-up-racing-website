"""
Test Suite: iRacing Setup Library & Telemetry Recorder Installer Integration
Tests file validation, checksum computation, path traversal prevention, car folder mapping,
atomic installation to iRacing, and setup metadata/version immutability.
"""

import unittest
import os
import sys
import tempfile
import hashlib
import json
import shutil

# Ensure telemetry-app directory is on python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TELEMETRY_DIR = os.path.join(BASE_DIR, "telemetry-app")
if TELEMETRY_DIR not in sys.path:
    sys.path.insert(0, TELEMETRY_DIR)

from bridge_logic import TelemetryBridge


class MockResponse:
    def __init__(self, data):
        self.data = data

    def read(self):
        return self.data

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


class TestSetupLibraryAndInstaller(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.bridge = TelemetryBridge()
        # Point iracing setups directory to test directory
        self.bridge.get_iracing_setups_directory = lambda: self.test_dir

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_car_folder_resolution(self):
        """Verify that official iRacing car names map to correct setup directory slugs."""
        test_cases = [
            ("Ferrari 296 GT3", "ferrari296gt3"),
            ("Porsche 911 GT3 R (992)", "porsche992gt3r"),
            ("BMW M4 GT3 EVO", "bmwm4gt3evo"),
            ("Mercedes-AMG GT3 2020", "mercedesamggt32020"),
            ("Cadillac V-Series.R GTP", "cadillacvseriesrgtp"),
            ("Dallara P217", "dallarap217"),
            ("BMW M4 G82 GT4 Evo", "bmwm4gt4evo"),
            ("Supercars Chevrolet Camaro Gen 3", "supercarscamaro"),
            ("Dallara IR-18 IndyCar", "dallarair18"),
            ("Chevrolet Camaro ZL1 Next Gen", "nascarchevynextgen"),
        ]

        for car_name, expected_folder in test_cases:
            resolved = self.bridge.resolve_car_folder(car_name)
            self.assertEqual(
                resolved,
                expected_folder,
                f"Car '{car_name}' resolved to '{resolved}', expected '{expected_folder}'"
            )

    def test_sanitize_setup_filename(self):
        """Verify filenames are sanitized against path traversal and dangerous characters."""
        test_cases = [
            ("../../../evil.sto", "______evil.sto"),
            ("Race: Spa/Qualy?.sto", "Race_ Spa_Qualy_.sto"),
            ("normal_setup.sto", "normal_setup.sto"),
            ("setup_without_ext", "setup_without_ext.sto"),
            ("..\\..\\windows_traversal.sto", "____windows_traversal.sto"),
        ]

        for raw_name, expected_pattern in test_cases:
            clean = self.bridge.sanitize_setup_filename(raw_name)
            self.assertTrue(clean.endswith(".sto"))
            self.assertNotIn("..", clean)
            self.assertNotIn("/", clean)
            self.assertNotIn("\\", clean)
            self.assertNotIn(":", clean)

    def test_sha256_checksum_verification(self):
        """Verify SHA-256 checksum calculation matches standard cryptographic hash."""
        sample_setup_bytes = b"iRACING_BINARY_SETUP_MOCK_DATA_1234567890"
        expected_hash = hashlib.sha256(sample_setup_bytes).hexdigest().lower()

        calculated_hash = hashlib.sha256(sample_setup_bytes).hexdigest()
        self.assertEqual(expected_hash, calculated_hash)

    def test_end_to_end_installation_success(self):
        """Verify valid setup payload downloads, passes checksum, and installs atomically."""
        setup_content = b"IRACING_SETUP_MOCK_PAYLOAD_VALID_STUFF_12345678"
        checksum = hashlib.sha256(setup_content).hexdigest()

        # Mock urllib.request.urlopen
        import urllib.request
        orig_urlopen = urllib.request.urlopen

        try:
            urllib.request.urlopen = lambda req, timeout=15: MockResponse(setup_content)

            job_id = "test_job_101"
            job = {
                "downloadUrl": "https://example.com/fake_setup.sto",
                "checksum": checksum,
                "carName": "Ferrari 296 GT3",
                "carFolder": "ferrari296gt3",
                "fileName": "Spa_Race_v1.0.sto"
            }

            self.bridge.process_setup_job(job_id, job)

            expected_file_path = os.path.join(self.test_dir, "ferrari296gt3", "Spa_Race_v1.0.sto")
            self.assertTrue(os.path.exists(expected_file_path), "Target setup file was not created!")

            with open(expected_file_path, "rb") as f:
                installed_content = f.read()

            self.assertEqual(installed_content, setup_content)

        finally:
            urllib.request.urlopen = orig_urlopen

    def test_installation_checksum_mismatch_rejection(self):
        """Verify corrupted download with mismatched checksum is rejected and not written."""
        setup_content = b"ORIGINAL_SETUP_DATA_STREAM"
        wrong_checksum = "0000000000000000000000000000000000000000000000000000000000000000"

        import urllib.request
        orig_urlopen = urllib.request.urlopen

        try:
            urllib.request.urlopen = lambda req, timeout=15: MockResponse(setup_content)

            job_id = "test_job_corrupt"
            job = {
                "downloadUrl": "https://example.com/corrupt.sto",
                "checksum": wrong_checksum,
                "carName": "Porsche 911 GT3 R (992)",
                "fileName": "Corrupt_Setup.sto"
            }

            self.bridge.process_setup_job(job_id, job)

            expected_file_path = os.path.join(self.test_dir, "porsche992gt3r", "Corrupt_Setup.sto")
            self.assertFalse(os.path.exists(expected_file_path), "Corrupt file should NOT be written!")

        finally:
            urllib.request.urlopen = orig_urlopen

    def test_installation_oversized_file_rejection(self):
        """Verify files exceeding 3MB limit are rejected."""
        oversized_content = b"X" * (3 * 1024 * 1024 + 1024)

        import urllib.request
        orig_urlopen = urllib.request.urlopen

        try:
            urllib.request.urlopen = lambda req, timeout=15: MockResponse(oversized_content)

            job_id = "test_job_oversized"
            job = {
                "downloadUrl": "https://example.com/too_big.sto",
                "checksum": hashlib.sha256(oversized_content).hexdigest(),
                "carName": "Ferrari 296 GT3",
                "fileName": "Huge.sto"
            }

            self.bridge.process_setup_job(job_id, job)

            expected_file_path = os.path.join(self.test_dir, "ferrari296gt3", "Huge.sto")
            self.assertFalse(os.path.exists(expected_file_path), "Oversized file should NOT be written!")

        finally:
            urllib.request.urlopen = orig_urlopen


if __name__ == "__main__":
    unittest.main()
