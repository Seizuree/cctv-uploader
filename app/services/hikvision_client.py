import requests
from requests.auth import HTTPBasicAuth
import xml.etree.ElementTree as ET


class HikvisionClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url.rstrip("/")
        self.auth = HTTPBasicAuth(username, password)

    def search_segments(self, start_time, end_time):
        url = f"{self.base_url}/ISAPI/ContentMgmt/search"
        body = f"""
        <CMSearchDescription>
            <searchID>1</searchID>
            <trackIDList><trackID>101</trackID></trackIDList>
            <timeSpanList>
                <timeSpan>
                    <startTime>{start_time}</startTime>
                    <endTime>{end_time}</endTime>
                </timeSpan>
            </timeSpanList>
            <maxResults>1000</maxResults>
        </CMSearchDescription>
        """
        r = requests.post(url, data=body, auth=self.auth, timeout=30)
        r.raise_for_status()
        return self._parse_xml(r.text)

    def _parse_xml(self, xml_text):
        root = ET.fromstring(xml_text)
        res = []
        for item in root.findall(".//searchMatchItem"):
            res.append(
                {
                    "fileName": item.find("fileName").text,
                    "start": item.find("startTime").text,
                    "end": item.find("endTime").text,
                }
            )
        return res

    def download_segment(self, file_name, outpath):
        url = f"{self.base_url}/ISAPI/ContentMgmt/download?fileName={file_name}"
        with requests.get(url, auth=self.auth, stream=True, timeout=60) as r:
            r.raise_for_status()
            with open(outpath, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
