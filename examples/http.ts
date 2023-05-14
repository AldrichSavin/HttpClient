import HttpClient from "../lib";
import CancelablePlugin from "./CancelablePlugin";

const httpClient = new HttpClient({
    plugins: [new CancelablePlugin()]
});

const id = httpClient.createCancelID();
httpClient.request({ 
    url: "/xx",
    method: "GET",
    cancelID: id,
});

httpClient.applyCancel(id);