import Store from "./Store";
import { Plugin, PluginDefinition, PluginOptionals } from "./Plugin";
import HttpClient, { MultiServiceBaseURLRecords } from "./HttpClient";

export default class PluginStore<UserMultiServiceBaseURLRecords = MultiServiceBaseURLRecords> extends Store<Plugin> {
    constructor(private readonly context: HttpClient<UserMultiServiceBaseURLRecords>) {
        super();
        this.context = context;
        this.initUserStore();
    }

    protected initUserStore() {
        if(this.context.options.store) {
            // @ts-ignore
            this.store = this.context.options.store;
        }
    }

    public getPlugins<PluginName extends PluginOptionals = PluginOptionals>(pluginName: PluginName): Plugin[] {
        return this.store.filter(plugin => {
            return typeof plugin[pluginName] === "function";
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
            // TODO: 如果其中一个插件运行失败，停止运行后续插件并抛出错误
            await hook.apply(this.context, args);        
        }
    }

    public runHook<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ) {
        const hooks = this.getHooks(pluginName);
        for (const hook of hooks) {
            hook.apply(this.context, args);
        }
    }

    /**
     * @title 洋葱模式运行插件的生命周期
     * 
     * @param pluginName
     * @param args 
     * @returns 
     */
    public runHookOnion<PluginName extends PluginOptionals = PluginOptionals>(
        pluginName: PluginName,
        ...args: Parameters<PluginDefinition[PluginName]>
    ): ReturnType<PluginDefinition[PluginName]> {
        const hooks = this.getHooks(pluginName);
        const [first, ...rest] = hooks;
        return rest.reduce((prev, next) => {
            return next.apply(this.context, [prev, ...args]);
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
    ): Promise<ReturnType<PluginDefinition[PluginName]>> {
        const hooks = this.getHooks(pluginName);
        const [first, ...rest] = hooks;
        return rest.reduce(async (prev, next) => {
            return next.apply(this.context, [await prev, ...args]);
        }, first.apply(this.context, args))
    }
}