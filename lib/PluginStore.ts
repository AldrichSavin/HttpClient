import Store from "./Store";
import { Plugin, PluginDefinition, PluginOptionals } from "./Plugin";
import HttpClient, { MultiServiceBaseURLRecords } from "./HttpClient";
import {isFunction} from "./util";

export default class PluginStore<UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords> extends Store<Plugin> {
    constructor(private readonly context: HttpClient<UserMultiServiceBaseURLRecords>) {
        super();
        this.context = context;
    }

    public getPlugins<PluginName extends PluginOptionals = PluginOptionals>(pluginName: PluginName): Plugin[] {
        return this.store.filter(plugin => {
            return isFunction(plugin[pluginName]);
        });
    }

    public getHooks<PluginName extends PluginOptionals = PluginOptionals>(pluginName: PluginName): PluginDefinition[PluginName][] {
        return this.getPlugins(pluginName).map(plugin => {
            return plugin[pluginName] as PluginDefinition[PluginName];
        });
    }

    /**
     * @title 同步运行插件的生命周期(会等待promise完成)
     * 
     * @param pluginName 插件的生命周期名称
     * @param args 传递给插件的参数
     */
    public async runHookSync<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ) {
        const hooks = this.getHooks(pluginName);
        for (const hook of hooks) {
            // @ts-ignore
            await hook.apply(this.context, args);
        }
    }

    public runHook<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ) {
        const hooks = this.getHooks(pluginName);
        for (const hook of hooks) {
            // @ts-ignore
            hook.apply(this.context, args);
        }
    }

    /**
     * @param pluginName
     * @param args 
     * @returns 
     */
    public runHookOnion<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ): ReturnType<PluginDefinition[PluginName]> | undefined {
        const hooks = this.getHooks(pluginName);
        /**
         * In case the plug-in is not queried,
         * it may mean that the hookName was passed in error or that the developer manually called
         * the method of executing the plug-in externally/but did not implement it
         *
         * In order to prevent the impact of misoperation on the data,
         * the internal default is to return undefined when there is no plug-in
         */
        if(!hooks.length) return undefined;

        const [first, ...rest] = hooks;
        /**
         * When a developer registers only one plugin,
         * it means that there is no need to continue with subsequent iterations
         */
        if(!rest.length && first) {
            // @ts-ignore
            return first.apply(this.context, args);
        }

        return rest.reduce((prev, next) => {
            // @ts-ignore
            return next.apply(this.context, [prev, ...args]);
            // @ts-ignore
        }, first.apply(this.context, args))
    }

    /**
     * 
     * @title 洋葱模式运行插件的生命周期(会等待promise完成)
     * 
     * @param pluginName 
     * @param args 
     * @returns 
     */
    public runHookOnionSync<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ): Promise<ReturnType<PluginDefinition[PluginName]>> | Promise<undefined> {
        const hooks = this.getHooks(pluginName);
        /**
         * In case the plug-in is not queried,
         * it may mean that the hookName was passed in error or that the developer manually called
         * the method of executing the plug-in externally/but did not implement it
         *
         * In order to prevent the impact of misoperation on the data,
         * the internal default is to return undefined when there is no plug-in
         */
        if(!hooks.length) return Promise.resolve(undefined);

        const [first, ...rest] = hooks;
        /**
         * When a developer registers only one plugin,
         * it means that there is no need to continue with subsequent iterations
         */
        if(!rest.length && first) {
            // @ts-ignore
            return first.apply(this.context, args);
        }

        return rest.reduce(async (prev, next) => {
            // @ts-ignore
            return next.apply(this.context, [await prev, ...args]);
            // @ts-ignore
        }, first.apply(this.context, args))
    }
}