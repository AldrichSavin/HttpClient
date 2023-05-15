import { ContentOptionalTypes, ContentTypeOptionalKeys, HttpClientFlag } from "./HttpClientFlag";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * 服务端请求ID
     */
    requestId?: string;

    /**
     * 是否启用请求的loading状态
     */
    loading?: boolean;

    /**
     * 针对单个请求的ContentType进行覆盖
     */
    requestType?: ContentOptionalTypes | ContentTypeOptionalKeys;

    /**
     * 用于取消请求的cancelID
     */
    cancelID?: string;

    /**
     * 自动带上API版本
     */
    autoAPIVersion?: boolean;

    /**
     * 是否允许不授权的请求
     */
    noAuth?: boolean | HttpClientFlag.ALLOWED_NOT_AUTHORIZED;

    /**
     * 启动mock模式
     *
     * 这个将会拦截掉所有的请求，并将请求转发实现的mock插件生命周期中，开发者自行实现mock插件
     * 至于插件中如何实现mock，并不属于这里的范畴
     */
    mock?: boolean;

    /**
     * @title 为什么需要WorkerAxiosRequestConfig
     *
     * 在Worker环境中因为不可以访问LocalStorage/SessionStorage等存储能力
     * 但是在与服务端交互的过程中或多或少会涉及到如下面场景
     * 1. 访问API时需要带上token, 但token存在LocalStorage中
     * 2. 国际化场景下，需要带上Accept-Language，但是Accept-Language存在LocalStorage中
     * ...
     * 因此，需要针对Worker环境中增加一些特有标识，告知请求插件的开发者可以根据这些标识进行特殊处理/兼容
     *
     * @note 其他的处理方式（待定）?
     * - 主线程和Worker线程都使用双方都能访问的存储能力，如IndexedDB?
     */
    worker?: {} | boolean;
  }
}
