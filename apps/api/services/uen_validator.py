"""
Singapore UEN (Unique Entity Number) validator.

Two-step validation:
1. Format check (immediate, local)
2. IRAS GST Listing lookup (best-effort, async)
   - Only GST-registered entities appear here (SGD 1M+ revenue or voluntary)
   - If not found: status = "pending_review" (admin verifies manually)
   - If found: status = "verified" with registered name
"""
import re
import httpx
from html.parser import HTMLParser

# UEN format patterns (Singapore ACRA)
# Type A: 8 digits + 1 uppercase letter (older businesses)
# Type B: YYYY + 5 digits + 1 uppercase letter (post-2009)
# Type C: letter prefix + digits/letters (govt, charities, etc.)
UEN_PATTERN = re.compile(
    r"^(\d{8}[A-Z]|\d{9}[A-Z]|[A-Z]\d{2}[A-Z]{2}\d{4}[A-Z]|T\d{2}[A-Z]{2}\d{4}[A-Z])$"
)


def validate_uen_format(uen: str) -> bool:
    """Quick local format check. Returns True if format looks valid."""
    return bool(UEN_PATTERN.match(uen.strip().upper()))


class _GSTResultParser(HTMLParser):
    """Simple parser to extract business name from IRAS search results table."""
    def __init__(self):
        super().__init__()
        self.found_name: str | None = None
        self._in_result_table = False
        self._td_count = 0
        self._capture_next = False

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "table" and "gstListing" in attr_dict.get("id", ""):
            self._in_result_table = True
        if self._in_result_table and tag == "td":
            self._td_count += 1
            # Typically: col1=UEN, col2=Name, col3=Effective date
            if self._td_count % 3 == 2:
                self._capture_next = True

    def handle_data(self, data):
        if self._capture_next and data.strip():
            self.found_name = data.strip()
            self._capture_next = False

    def handle_endtag(self, tag):
        if tag == "td":
            self._capture_next = False


async def lookup_uen_iras(uen: str) -> dict:
    """
    Attempt to look up UEN on IRAS GST Listing.
    Returns:
      {"status": "verified", "name": "COMPANY PTE LTD"}
      {"status": "pending_review", "name": None}   - not GST-registered or lookup failed
      {"status": "format_invalid"}
    """
    uen = uen.strip().upper()

    if not validate_uen_format(uen):
        return {"status": "format_invalid", "name": None}

    base = "https://mytax.iras.gov.sg/ESVWeb/default.aspx"
    params = {"target": "GSTListingSearch"}
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-SG,en;q=0.9",
    }

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            # Step 1: GET the search page to extract ASP.NET form fields
            resp1 = await client.get(base, params=params, headers=headers)
            if resp1.status_code != 200:
                return {"status": "pending_review", "name": None}

            html1 = resp1.text

            # Extract hidden ASP.NET form fields
            def extract_hidden(name: str) -> str:
                pattern = re.compile(
                    rf'<input[^>]+name="{re.escape(name)}"[^>]+value="([^"]*)"',
                    re.IGNORECASE,
                )
                m = pattern.search(html1)
                return m.group(1) if m else ""

            viewstate = extract_hidden("__VIEWSTATE")
            viewstate_gen = extract_hidden("__VIEWSTATEGENERATOR")
            event_validation = extract_hidden("__EVENTVALIDATION")

            if not viewstate:
                return {"status": "pending_review", "name": None}

            # Step 2: POST the search form
            form_data = {
                "__VIEWSTATE": viewstate,
                "__VIEWSTATEGENERATOR": viewstate_gen,
                "__EVENTVALIDATION": event_validation,
                # Field names determined from IRAS page source (may shift with site updates)
                "ctl00$ContentPlaceHolder1$txtUEN": uen,
                "ctl00$ContentPlaceHolder1$btnSearch": "Search",
            }

            resp2 = await client.post(
                base,
                params=params,
                data=form_data,
                headers={**headers, "Content-Type": "application/x-www-form-urlencoded", "Referer": resp1.url},
            )

            if resp2.status_code != 200:
                return {"status": "pending_review", "name": None}

            # Parse results
            parser = _GSTResultParser()
            parser.feed(resp2.text)

            if parser.found_name:
                return {"status": "verified", "name": parser.found_name}

            # Also check for UEN appearing in the response text directly
            if uen in resp2.text:
                # UEN found in page but name parsing may have failed
                return {"status": "verified", "name": None}

            # Not found on IRAS - could be non-GST-registered business
            return {"status": "pending_review", "name": None}

    except Exception:
        # Any network/parsing error -> flag for manual review
        return {"status": "pending_review", "name": None}
