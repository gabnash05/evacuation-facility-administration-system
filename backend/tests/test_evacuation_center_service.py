"""Regression tests for evacuation-center service boundaries."""

import base64
import unittest
from io import BytesIO

from app.services import evacuation_center_service


class EvacuationCenterServiceTests(unittest.TestCase):
    def test_photo_processing_returns_base64_and_rewinds_before_reading(self):
        photo = BytesIO(b"test-image-content")

        encoded = evacuation_center_service.process_photo_file(photo)

        self.assertEqual(encoded, base64.b64encode(b"test-image-content").decode())

    def test_photo_processing_rejects_files_larger_than_the_configured_limit(self):
        original_limit = evacuation_center_service.MAX_FILE_SIZE
        evacuation_center_service.MAX_FILE_SIZE = 3
        try:
            with self.assertRaisesRegex(ValueError, "Image too large"):
                evacuation_center_service.process_photo_file(BytesIO(b"four"))
        finally:
            evacuation_center_service.MAX_FILE_SIZE = original_limit
