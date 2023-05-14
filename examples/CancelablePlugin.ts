import axios, {
  CancelTokenSource,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Plugin } from "../lib";

const cancelableCache = new Map<string, CancelTokenSource>();

export default class CancelablePlugin implements Plugin {
  onRequest(service: AxiosRequestConfig["url"], config: AxiosRequestConfig) {
    const cancelSource = axios.CancelToken.source();
    config.cancelToken = cancelSource.token;
    cancelableCache.set(config.cancelID, cancelSource);
  }

  onFinally(context: {
    config?: AxiosRequestConfig;
    response?: AxiosResponse;
    error?: Error;
    reason?: string;
  }) {
    if (context.config?.cancelID) {
      cancelableCache.delete(context.config.cancelID);
    }
  }

  onCancel(cancelID: string, reason?: string) {
    const cancelToken = cancelableCache.get(cancelID);
    if (cancelToken) {
      cancelToken.cancel(reason);
      cancelableCache.delete(cancelID);
    }
  }
}
