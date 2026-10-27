import hashlib
import importlib.util
from pathlib import Path
from email.message import Message
from io import BytesIO
import pytest

spec = importlib.util.spec_from_file_location(
    "download_audio", Path(__file__).resolve().parents[2] / "scripts/download_audio.py"
)
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class AudioResponse(BytesIO):
    headers = Message()
    headers["Content-Type"] = "audio/mpeg"


def test_changed_download_does_not_overwrite_existing_file(tmp_path, monkeypatch):
    original = b"original local audio"
    destination = tmp_path / "track.mp3"
    destination.write_bytes(original)
    track = {"title": "Test", "audio_source_url": "https://incompetech.com/test.mp3",
             "audio_sha256": hashlib.sha256(b"pinned original").hexdigest()}
    monkeypatch.setattr(installer, "urlopen", lambda *args, **kwargs: AudioResponse(b"changed audio" * 1000))
    with pytest.raises(ValueError, match="Checksum changed"):
        installer.download(track, destination)
    assert destination.read_bytes() == original
    assert not destination.with_suffix(".mp3.part").exists()


def test_verified_download_is_reused_without_network(tmp_path, monkeypatch):
    original = b"valid original" * 200
    destination = tmp_path / "track.mp3"
    destination.write_bytes(original)
    track = {"title": "Test", "audio_sha256": hashlib.sha256(original).hexdigest()}
    def unexpected_network(*args, **kwargs):
        pytest.fail("Verified audio should not be downloaded again")
    monkeypatch.setattr(installer, "urlopen", unexpected_network)
    installer.download(track, destination)
