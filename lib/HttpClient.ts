import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import PluginStore from "./PluginStore";
import { Plugin } from "./Plugin";
import { isObject, isString, genUUID } from "./util";
import { HttpErrors } from "./HttpErrors";

export type MultiServiceBaseURLRecords = Record<string, string> & {
  default?: string;
};

export interface HttpClientOptions<
  UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords
> extends Omit<AxiosRequestConfig, "baseURL"> {
  /**
   * 被扩展过的, 请求的基础URL, 支持多个服务地址
   */
  baseURL?:
    | AxiosRequestConfig["baseURL"]
    | UserMultiServiceBaseURLRecords;

  /**
   * axios实例
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

export default class HttpClient<
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
    public readonly options: HttpClientOptions<UserMultiServiceBaseURLRecords> = {}
  ) {
    this.initGlobalPluginStore();

    this.initRequestClient();
    this.initGlobalPlugin();

    /**
     * 初始化拦截器
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
      // 上层开发者自定义请求
      if (this.isProtocol(baseURL)) {
        return baseURL;
      }

      // 将baseURL作为多请求的Key使用
      if (isObject(this.options.baseURL)) {
        return (this.options.baseURL as MultiServiceBaseURLRecords)?.[baseURL] || baseURL;
      }

      return baseURL;
    }

    // 配置的为单服务
    if (isString(this.options.baseURL)) {
      return this.options.baseURL;
    }

    /**
     * 初始化配置default的url
     */
    if (
      isObject(this.options.baseURL) &&
      Reflect.has(this.options.baseURL || {}, "default")
    ) {
      return Reflect.get(this.options.baseURL || {}, "default");
    }

    /**
     * axios实例的url
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
      throw new Error("HttpClient instance is not initialized");
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
            HttpErrors.INVALID_REQUEST_ERROR,
          error
        );
        this.plugin!.runHook("onFinally", {
          config: error.config,
          response: error.response,
          error,
          reason: HttpErrors.INVALID_REQUEST_ERROR,
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
            HttpErrors.INVALID_RESPONSE_ERROR,
          error
        );
        this.plugin!.runHook("onFinally", {
          config: error.config,
          response: error.response,
          error,
          reason: HttpErrors.INVALID_RESPONSE_ERROR,
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
