import requests
from requests.compat import urljoin


class DigimonClient:

    BASE_URL = "https://digimon-api.vercel.app/api/digimon/"

    def __init__(self, session=None, timeout=5):
        self.session = session or requests.Session()
        self.timeout = timeout

    def _request(self, method, url_path, params=None):
        params = params or {}
        url = urljoin(self.BASE_URL, url_path)
        headers = {
            "User-Agent": "pydigimon",
            "Content-Type": "application/json"
        }
        result = self.session.request(method, url, headers=headers, params=params,
                                      timeout=self.timeout)
        return result

    def get_all_digimon(self):
        url_path = ''
        method = 'GET'
        return self._request(method, url_path)

    def get_digimon_by_name(self, name):
        url_path = f"name/{name}"
        method = 'GET'
        return self._request(method, url_path)

    def get_digimon_by_level(self, level):
        url_path = f"level/{level}"
        method = 'GET'
        return self._request(method, url_path)
