import { ConnectionAuth } from "@trigger.dev/core";
import { AsyncLocalStorage } from "node:async_hooks";
import { IOWithIntegrations, TriggerIntegration } from "./integrations";
import { IO } from "./io";

export function createIOWithIntegrations<TIntegrations extends Record<string, TriggerIntegration>>(
  io: IO,
  auths?: Record<string, ConnectionAuth | undefined>,
  integrations?: TIntegrations
): IOWithIntegrations<TIntegrations> {
  if (!integrations) {
    return io as IOWithIntegrations<TIntegrations>;
  }

  const connections = Object.entries(integrations).reduce((acc, [connectionKey, integration]) => {
    let auth = auths?.[connectionKey];

    acc[connectionKey] = {
      integration,
      auth,
    };

    return acc;
  }, {} as any);

  return new Proxy(io, {
    get(target, prop, receiver) {
      // We can return the original io back if the prop is __io
      if (prop === "__io") {
        return io;
      }

      if (prop in connections) {
        const { integration, auth } = connections[prop];
        const asyncLocalStorage = new AsyncLocalStorage();
        asyncLocalStorage.run({ auth, io }, () => {
          //you can only access the auth and io from local store inside here… AND only if you have a reference to the store
        });

        //we could have an asyncLocalStorage somewhere that can be access from the integration? But it'd have to be global in some way
        return integration;
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value == "function" ? value.bind(target) : value;
    },
  }) as IOWithIntegrations<TIntegrations>;
}
