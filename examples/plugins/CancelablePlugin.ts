import { Plugin } from "../../dist"

export default class CancelablePlugin implements Plugin {
    name = 'cancelable';
    onRequest(request: any) {
        console.log('request', request);
    }
}