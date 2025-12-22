import time
import requests
import xml.etree.ElementTree as ET
from requests.auth import HTTPDigestAuth
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib.parse import urlparse
import urllib3

from app.core.config import TRACK_ID

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class HikvisionClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url.rstrip("/")
        self.username = username
        self.password = password
        self.session = self._create_session()

    def _create_session(self):
        session = requests.Session()
        retry = Retry(
            total=5,
            backoff_factor=2,
            status_forcelist=[500, 502, 503, 504],
        )
        adapter = HTTPAdapter(
            max_retries=retry,
            pool_connections=10,
            pool_maxsize=10,
        )
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        session.auth = HTTPDigestAuth(self.username, self.password)
        return session

    def search_segments(self, start_time, end_time):
        url = f"{self.base_url}/ISAPI/ContentMgmt/search"

        xml_body = f"""<?xml version="1.0" encoding="utf-8"?>
<CMSearchDescription>
    <searchID>C{int(time.time())}</searchID>
    <trackList><trackID>{TRACK_ID}</trackID></trackList>
    <timeSpanList>
        <timeSpan>
            <startTime>{start_time}</startTime>
            <endTime>{end_time}</endTime>
        </timeSpan>
    </timeSpanList>
    <maxResults>100</maxResults>
    <searchResultPosition>0</searchResultPosition>
    <metadataList><metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor></metadataList>
</CMSearchDescription>"""

        r = self.session.post(
            url,
            data=xml_body,
            headers={"Content-Type": "application/xml"},
            timeout=(10, 30),
            verify=False,
        )
        r.raise_for_status()
        return self._parse_xml(r.text)

    def _parse_xml(self, xml_text):
        root = ET.fromstring(xml_text)
        ns = "{http://www.hikvision.com/ver20/XMLSchema}"

        matches = root.findall(f".//{ns}searchMatchItem")
        if not matches:
            matches = root.findall(".//searchMatchItem")

        res = []
        for item in matches:
            playback_uri = item.find(f".//{ns}playbackURI")
            if playback_uri is None:
                playback_uri = item.find(".//playbackURI")

            start_node = item.find(f".//{ns}startTime")
            if start_node is None:
                start_node = item.find(".//startTime")

            end_node = item.find(f".//{ns}endTime")
            if end_node is None:
                end_node = item.find(".//endTime")

            if playback_uri is not None and start_node is not None:
                res.append({
                    "playbackURI": playback_uri.text,
                    "start": start_node.text,
                    "end": end_node.text if end_node is not None else None,
                })
        return res

    def download_segment(self, playback_uri, outpath):
        parsed = urlparse(playback_uri)
        final_url = f"{self.base_url}{parsed.path}"
        if parsed.query:
            final_url = f"{final_url}?{parsed.query}"

        with self.session.get(
            final_url,
            stream=True,
            timeout=(10, 300),
            verify=False,
        ) as r:
            r.raise_for_status()
            with open(outpath, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
