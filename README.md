### Axios extensible plug-in implementation
Do We have to tie the business logic to the request library? This repository tries to give you another way to decouple the request library from the business logic by implementing plugins.

### What is this?
Before
```typescript
import axios from "axios";

const instance = axios.create({ baseURL: "https://xxx.com" });

instance.interceptors.request.use((config) => {
    // doAuthentication
    // doSetCancelToken
    // doSetHeaders
    // doSomethingElse
    return config;
});

instance.interceptors.response.use((response) => {
    // doCheckStatus
    // doCancel
    // doCheckError
    // doSomethingElse
    return response;
});
```

Now
```typescript
import HttpClient from "./HttpClient";

// plugins
// - AuthenticationPlugin.ts
// - ErrorPlugin.ts
// - LoadingPlugin.ts
// - LogPlugin.ts
// - TimeoutPlugin.ts
// - TransformPlugin.ts
// - RetryPlugin.ts
// - CachePlugin.ts

const client: HttpClient = new HttpClient({
    // single server
    baseURL: "https://xxx.com",
    plugins: [
        new AuthenticationPlugin(),
        new ErrorPlugin(),
        new RetryPlugin(),
    ]
});

client.get('/api/xxx', {
    plugins: [
        new LoadingPlugin(), // A plug-in is used for a single request
    ]
});
```
