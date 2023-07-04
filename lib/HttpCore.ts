import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import PluginStore from "./PluginStore";
import { Plugin } from "./Plugin";
import { isObject, isString, genUUID } from "./util";
import { Status } from "./status";

export type MultiServiceBaseURLRecords = Record<string, string> & {
  default?: string;
};

export interface HttpCoreOptions<
  UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords
> extends Omit<AxiosRequestConfig, "baseURL"> {
  /**
   * 被扩展过的, 请求的基础URL, 支持多个服务地址
   */
  baseURL?:
    | AxiosRequestConfig["baseURL"]
    | UserMultiServiceBaseURLRecords;

  /**
   * 使用自己提供的axios实例
   */
  client?: AxiosInstance;

  /**
   * 自定义插件
   */
  plugins?: Plugin[];

  /**
   * 自定义存储插件的类
   */
  store?: PluginStore<UserMultiServiceBaseURLRecords>;

  /**
   * 全局loading
   */
  loading?: boolean;

  /**
   * worker 环境
   */
  worker?: boolean;
}

export default class HttpCore<
  UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords
> {
  /**
   * 插件类
   */
  public plugin: PluginStore<UserMultiServiceBaseURLRecords> | undefined;

  /**
   * Axios 请求实例
   */
  public requestClient: AxiosInstance | undefined;

  constructor(
    public readonly options: HttpCoreOptions<UserMultiServiceBaseURLRecords> = {}
  ) {
    this.initGlobalPluginStore();

    this.initRequestClient();
    this.initGlobalPlugin();

    /**
     * @title Initialize the interceptor
     *
     * @description
     * The interceptor is initialized but not associated with any implementation,
     * the specific interceptor implementation is provided by the plug-in system
     * */
    this.requestInterceptor();
    this.responseInterceptor();
  }

  protected initGlobalPluginStore() {
    if (this.options.store) {
      this.plugin = this.options.store;
    } else {
      this.plugin = new PluginStore<UserMultiServiceBaseURLRecords>(this);
    }
  }

  protected initGlobalPlugin() {
    if (this.options.plugins && this.options.plugins.length) {
      this.plugin!.add(this.options.plugins);
    }
  }

  protected initRequestClient() {
    const userHttpClient = this.options.client;
    if (userHttpClient) {
      this.requestClient = userHttpClient;
    } else {
      // TODO: 更好的提取参数方式
      const {
        client,
        baseURL,
        loading,
        store,
        noAuth,
        worker,
        plugins,
        ...originAxiosParams
      } = this.options;
      this.requestClient = axios.create(originAxiosParams);
    }
  }

  private isProtocol(url: string): boolean {
    return /(http|https|ws|wss):\/\/([\w.]+\/?)\S*/.test(url);
  }

  public getBaseURL(
    baseURL?: AxiosRequestConfig["baseURL"] | string
  ): AxiosRequestConfig["baseURL"] | string {
    if (baseURL) {
      /**
       * If baseURL is passed during the request and is a valid http/https/ws/wss address,
       * the passed baseURL is taken as the interface address and the request prefix is not automatically added
       */
      if (this.isProtocol(baseURL)) {
        return baseURL;
      }

      /**
       * Due to the internal extension of axios own baseURL attribute,
       * it is possible to pass an object to baseURL when initializing the instance,
       * with the corresponding key being any name and the value being the address of the service (e.g., api interface address).
       *
       * Therefore, when the estrus request, you can specify the key configured at the initialization of the baseURL,
       * the internal will be mapped to the corresponding request prefix, and automatically added to the request
       */
      if (isObject(this.options.baseURL)) {
        return (this.options.baseURL as MultiServiceBaseURLRecords)?.[baseURL] || baseURL;
      }

      return baseURL;
    }

    // single service mode
    if (isString(this.options.baseURL)) {
      return this.options.baseURL;
    }

    /**
     * In multiService mode, if the corresponding key cannot be found, try to find default
     */
    if (
      isObject(this.options.baseURL) &&
      Reflect.has(this.options.baseURL || {}, "default")
    ) {
      return Reflect.get(this.options.baseURL || {}, "default");
    }

    /**
     * When a developer uses its own axios instance,
     * it might set baseURL to the defaults property and finally try to look it up in defaults
     */
    return this.requestClient?.defaults?.baseURL || "";
  }

  protected mergeConfig(config: AxiosRequestConfig, userConfig: AxiosRequestConfig) {
    return Object.assign({}, config, userConfig);
  }

  public request<
    Data = any,
    D = any,
    R extends AxiosResponse<any> = AxiosResponse<Data>
  >(config: AxiosRequestConfig<D>): Promise<AxiosResponse<Data>> {
    if (!this.requestClient?.request) {
      throw new Error("HttpCore instance is not initialized");
    }

    this.plugin!.runHookOnionSync("onBefore", config)

    return this.requestClient.request<Data, R, D>(
      this.mergeConfig(config, {
        baseURL: this.getBaseURL(config.baseURL),
      })
    );
  }

  public requestInterceptor() {
    this.requestClient!.interceptors.request.use(
      (config) => {
        this.plugin!.runHook("onRequest", config.url, config);
        return config;
      },
      (error) => {
        this.plugin!.runHook(
          "onError",
            Status.INVALID_REQUEST_ERROR,
          error
        );
        this.plugin!.runHook("onFinally", {
          config: error.config,
          response: error.response,
          error,
          reason: Status.INVALID_REQUEST_ERROR,
        });
        return Promise.reject(error);
      }
    );
  }

  public responseInterceptor() {
    this.requestClient!.interceptors.response.use(
      async (response) => {
        const userResponseData = await this.plugin!.runHookOnionSync(
          "onResponse",
          response.data,
          response
        );
        const result = userResponseData || response.data;
        this.plugin!.runHook("onFinally", { config: response.config, response });
        return result;
      },
      (error) => {
        this.plugin!.runHook(
          "onError",
            Status.INVALID_RESPONSE_ERROR,
          error
        );
        this.plugin!.runHook("onFinally", {
          config: error.config,
          response: error.response,
          error,
          reason: Status.INVALID_RESPONSE_ERROR,
        });
        return Promise.reject(error);
      }
    );
  }

  public applyCancel(cancelID: string, reason?: string) {
    this.plugin!.runHook("onCancel", cancelID, reason);
  }

  public createCancelID() {
    return genUUID();
  }
}
