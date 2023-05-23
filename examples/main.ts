import CancelablePlugin from "./plugins/CancelablePlugin";

console.log('app.ts loaded');
import HttpClient from "../dist";

const client = new HttpClient({
    plugins: [
        new CancelablePlugin()
    ]
});

console.log('client created', client);
client.requestClient.request({
    url: 'https://jsonplaceholder.typicode.com/todos/1',
}).then((response) => {})