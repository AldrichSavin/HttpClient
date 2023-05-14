import HttpClient from "../lib";

class MyHttpClient extends HttpClient {
    get(url, params) {
        this.request({ url, ...params })
    }
}