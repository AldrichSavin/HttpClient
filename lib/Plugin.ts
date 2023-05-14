import { AxiosResponse, AxiosRequestConfig } from "axios";
import { HttpErrorStatus } from "./HttpErrorStatus";

export type MockAdapter =
  | { mock: false }
  | {
      mock: true;
      mockService: <Data = any>(
        config: AxiosRequestConfig,
      ) => Promise<AxiosRequestConfig<Data>>;
    };

export interface PluginDefinition {
    onBefore: (config: AxiosRequestConfig) => AxiosRequestConfig | void | MockAdapter;
    
    onRequest: (
        service: AxiosRequestConfig["url"] | string,
        config: AxiosRequestConfig,
    ) => void | AxiosRequestConfig;

    onResponse: (responseData: AxiosResponse["data"], response: AxiosResponse) => Promise<AxiosResponse['data'] | AxiosResponse | void> | AxiosResponse['data'] | AxiosResponse;
    onError: (
        httpErrorReason: string | HttpErrorStatus,
        error?: Error,
        context?: Record<string, any>,
    ) => void;
    
    onCancel: (
        cancelID: string,
        reason?: string | HttpErrorStatus,
        config?: AxiosRequestConfig,
        context?: Record<string, any>,
    ) => void;

    onFinally: (context: {
        config?: AxiosRequestConfig;
        response?: AxiosResponse;
        error?: Error;
        reason?: string;
    }) => void;

    // TODO: add more hooks
    destroy: () => void;
}

export type PluginOptionals = keyof PluginDefinition;

export interface Plugin extends Partial<PluginDefinition> {
    /**
     * Plugin name
     */
    name?: string;
    /**
     * Plugin version
     */
    version?: string;
    /**
     * Plugin description
     */
    description?: string;

    [key: string]: any;
}
