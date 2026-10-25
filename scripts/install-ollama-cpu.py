"""Extract CPU runtime files from the official portable ZIP using HTTP ranges.

No third-party Python packages, installer, global PATH edits, or GPU libraries.
ZIP CRCs are verified by zipfile; download uses verified HTTPS to GitHub.
"""
import io
from pathlib import Path
import urllib.request
import zipfile

URL = 'https://github.com/ollama/ollama/releases/download/v0.40.10/ollama-windows-amd64.zip'
SIZE = 1586229413
DESTINATION = Path(__file__).resolve().parents[1] / '.local/rag/ollama'


class RemoteZip(io.RawIOBase):
    def __init__(self):
        self.position = 0
        self.cache_start = SIZE
        self.cache = b''

    def seekable(self):
        return True

    def readable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else SIZE + offset
        return self.position

    def fetch(self, start, length):
        request = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{start + length - 1}'})
        with urllib.request.urlopen(request, timeout=180) as response:
            if response.status != 206:
                raise RuntimeError('Server did not honor HTTP ranges; refusing full archive download.')
            if response.headers.get('Content-Range') != f'bytes {start}-{start + length - 1}/{SIZE}':
                raise RuntimeError('Unexpected archive range or version.')
            data = response.read()
        if len(data) != length:
            raise RuntimeError('Incomplete archive range.')
        return data

    def read(self, length=-1):
        length = min(length if length >= 0 else SIZE - self.position, SIZE - self.position)
        if length <= 0:
            return b''
        if self.position >= self.cache_start:
            offset = self.position - self.cache_start
            data = self.cache[offset:offset + length]
        else:
            data = self.fetch(self.position, length)
        self.position += len(data)
        return data


def main():
    remote = RemoteZip()
    with zipfile.ZipFile(remote) as archive:
        files = [entry for entry in archive.infolist() if not entry.is_dir() and (
            entry.filename == 'ollama.exe' or (
                entry.filename.startswith('lib/ollama/') and len(Path(entry.filename).parts) == 3
            )
        )]
        remote.cache_start = archive.getinfo('lib/ollama/ggml-base.dll').header_offset
        suffix_size = SIZE - remote.cache_start
        if suffix_size > 100_000_000:
            raise RuntimeError('Unexpected archive layout; CPU suffix exceeds 100 MB.')
        print(f'Downloading {suffix_size / 1_000_000:.1f} MB CPU runtime suffix', flush=True)
        remote.cache = remote.fetch(remote.cache_start, suffix_size)
        root = DESTINATION.resolve()
        root.mkdir(parents=True, exist_ok=True)
        for entry in files:
            output = (root / entry.filename).resolve()
            if not output.is_relative_to(root):
                raise RuntimeError('Unsafe ZIP member path.')
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(archive.read(entry))
        print(f'Extracted {len(files)} CPU runtime files to {root}', flush=True)


if __name__ == '__main__':
    main()
