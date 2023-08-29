import type {
  Block,
  ChatPostMessageResponse,
  KnownBlock,
  MessageAttachment,
  MessageMetadata,
  WebAPIPlatformError,
} from "@slack/web-api";
import { WebClient } from "@slack/web-api";
import type {
  ConnectionAuth,
  IO,
  IOTask,
  IntegrationTaskKey,
  OmitIndexSignature,
  Prettify,
  RunTaskErrorCallback,
  RunTaskOptions,
  RunTaskResult,
  TriggerIntegration,
} from "@trigger.dev/sdk";

export type SlackIntegrationOptions = {
  id: string;
};

type ConversationsJoinResponse = Awaited<ReturnType<SlackClientType["conversations"]["join"]>>;

type SlackClientType = InstanceType<typeof WebClient>;

export type ChatPostMessageArguments = {
  channel: string;
  text?: string;
  as_user?: boolean;
  attachments?: MessageAttachment[];
  blocks?: (KnownBlock | Block)[];
  icon_emoji?: string;
  icon_url?: string;
  metadata?: MessageMetadata;
  link_names?: boolean;
  mrkdwn?: boolean;
  parse?: "full" | "none";
  reply_broadcast?: boolean;
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  username?: string;
};

export class Slack implements TriggerIntegration {
  private _options: SlackIntegrationOptions;
  private _client?: WebClient;
  private _io?: IO;
  private _connectionKey?: string;

  constructor(private options: SlackIntegrationOptions) {
    this._options = options;
  }

  get authSource() {
    return "HOSTED" as const;
  }

  get id() {
    return this.options.id;
  }

  get metadata() {
    return { id: "slack", name: "Slack.com" };
  }

  cloneForRun(io: IO, connectionKey: string, auth?: ConnectionAuth) {
    const slack = new Slack(this._options);
    slack._io = io;
    slack._connectionKey = connectionKey;
    if (!auth) {
      throw new Error("No auth");
    }
    slack._client = new WebClient(auth.accessToken);
    return slack;
  }

  runTask<TResult extends RunTaskResult = void>(
    key: IntegrationTaskKey,
    callback: (client: WebClient, task: IOTask, io: IO) => Promise<TResult>,
    options?: RunTaskOptions,
    errorCallback?: RunTaskErrorCallback
  ) {
    if (!this._io) throw new Error("No IO");
    if (!this._connectionKey) throw new Error("No connection key");

    return this._io.runTask<TResult>(
      key,
      (task, io) => {
        if (!this._client) throw new Error("No client");
        return callback(this._client, task, io);
      },
      { icon: "slack", ...(options ?? {}), connectionKey: this._connectionKey },
      errorCallback
    );
  }

  postMessage(
    key: IntegrationTaskKey,
    params: ChatPostMessageArguments
  ): Promise<Prettify<OmitIndexSignature<ChatPostMessageResponse>>> {
    return this.runTask(
      key,
      async (client) => {
        try {
          const message: Prettify<OmitIndexSignature<ChatPostMessageResponse>> =
            await client.chat.postMessage(params);
          return message;
        } catch (error) {
          if (isPlatformError(error)) {
            if (error.data.error === "not_in_channel") {
              const joinResponse = await this.joinConversation(`Join ${params.channel}`, {
                channel: params.channel,
              });

              if (joinResponse.ok) {
                return await client.chat.postMessage(params);
              }
            }
          }

          throw error;
        }
      },
      {
        name: "Post Message",
        params,
        icon: "slack",
        properties: [
          {
            label: "Channel ID",
            text: params.channel,
          },
          ...(params.text ? [{ label: "Message", text: params.text }] : []),
        ],
      }
    );
  }

  joinConversation(
    key: IntegrationTaskKey,
    params: { channel: string }
  ): Promise<OmitIndexSignature<ConversationsJoinResponse>> {
    return this.runTask(
      key,
      async (client) => {
        const result: OmitIndexSignature<ConversationsJoinResponse> =
          await client.conversations.join(params);
        return result;
      },
      {
        name: "Join Channel",
        params,
        icon: "slack",
        properties: [
          {
            label: "Channel ID",
            text: params.channel,
          },
        ],
      }
    );
  }
}

function isPlatformError(error: unknown): error is WebAPIPlatformError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "slack_webapi_platform_error"
  );
}
