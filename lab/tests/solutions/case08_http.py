"""Case 08: the 304 that lied.

Book pages are sent with an ETag, so a browser can ask "has this changed?" instead of downloading
the page again. After a price drops, every browser that has seen the page keeps showing the old
price. The server keeps answering 304 Not Modified. It is wrong.
Run it: uv run python -m shop run 8
"""

import hashlib
from dataclasses import dataclass

PRICES = {1: "12.00", 2: "8.50"}


@dataclass
class Response:
    status: int
    headers: dict[str, str]
    body: str = ""


class Server:
    def __init__(self) -> None:
        self.prices = dict(PRICES)
        self.full_pages = 0  # responses that carried the whole page

    def render(self, book_id: int) -> str:
        return f"<h1>Book {book_id}</h1><p>price {self.prices[book_id]}</p>"

    def etag(self, path: str, body: str) -> str:
        """A fingerprint of the response, in quotes as HTTP wants it."""
        return '"' + hashlib.sha256(body.encode()).hexdigest()[:16] + '"'

    def handle(self, path: str, headers: dict[str, str]) -> Response:
        body = self.render(int(path.rsplit("/", 1)[1]))
        tag = self.etag(path, body)
        # no-cache does not mean "do not cache". It means "check with me before you reuse it".
        common = {"ETag": tag, "Cache-Control": "no-cache"}
        if headers.get("If-None-Match") == tag:
            return Response(304, common)
        self.full_pages += 1
        return Response(200, common, body)


class Browser:
    """Keeps the pages it has seen, and asks the server before reusing one."""

    def __init__(self, server: Server) -> None:
        self.server = server
        self.saved: dict[str, Response] = {}
        self.statuses: list[int] = []

    def visit(self, path: str) -> str:
        saved = self.saved.get(path)
        headers = {"If-None-Match": saved.headers["ETag"]} if saved else {}
        response = self.server.handle(path, headers)
        self.statuses.append(response.status)
        if response.status == 304 and saved:
            return saved.body
        self.saved[path] = response
        return response.body


def sale() -> tuple[Browser, str, str]:
    server = Server()
    browser = Browser(server)
    before = browser.visit("/books/1")
    server.prices[1] = "9.99"
    after = browser.visit("/books/1")
    return browser, before, after


def run() -> None:
    browser, before, after = sale()
    print(f"first visit:   {browser.statuses[0]}  {before}")
    print("the price drops to 9.99")
    print(f"second visit:  {browser.statuses[1]}  {after}")
