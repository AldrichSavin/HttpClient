import HttpCore, {HttpCoreOptions, MultiServiceBaseURLRecords} from "./HttpCore";
import {AxiosRequestConfig, AxiosResponse} from "axios";

export class HttpClient<
  UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords
> extends HttpCore<UserMultiServiceBaseURLRecords> {
    constructor(options: HttpCoreOptions<UserMultiServiceBaseURLRecords> = {}) {
        super(options);
    };

    public get<T, R, D>(url: AxiosRequestConfig["url"], config?: AxiosRequestConfig) {
        return this.requestClient?.request<T, R, D>({
            method: "GET",
            url,
            ...config
        });
    }

    public post<T, R, D>(url: AxiosRequestConfig["url"], data?: D, config?: AxiosRequestConfig) {
        return this.requestClient?.request<T, R, D>({
            method: "POST",
            url,
            data,
            ...config
        })
    }

    public put<T, R, D>(url: AxiosRequestConfig["url"], data?: D, config?: AxiosRequestConfig) {
        return this.requestClient?.request<T, R, D>({
            method: "PUT",
            url,
            data,
            ...config
        })
    }

    public delete<T, R, D>(url: AxiosRequestConfig["url"], config?: AxiosRequestConfig) {
        return this.requestClient?.request<T, R, D>({
            method: "DELETE",
            url,
            ...config
        })
    }

    public patch<T, R, D>(url: AxiosRequestConfig["url"], data?: D, config?: AxiosRequestConfig) {
        return this.requestClient?.request<T, R, D>({
            method: "PATCH",
            url,
            data,
            ...config
        })
    }
}