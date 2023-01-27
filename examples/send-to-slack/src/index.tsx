import { Trigger, customEvent } from "@trigger.dev/sdk";
import { slack } from "@trigger.dev/integrations";
import JSXSlack, {
  Actions,
  Blocks,
  Button,
  Section,
  Select,
  Option,
} from "jsx-slack";
import { z } from "zod";

new Trigger({
  id: "send-to-slack-on-new-domain",
  name: "Send to Slack on new domain",
  apiKey: "trigger_dev_zC25mKNn6c0q",
  endpoint: "ws://localhost:8889/ws",
  logLevel: "debug",
  on: customEvent({
    name: "domain.created",
    schema: z.object({
      id: z.string(),
      customerId: z.string(),
      domain: z.string(),
    }),
  }),
  run: async (event, ctx) => {
    const response = await slack.postMessage("send-to-slack", {
      channelName: "test-integrations",
      text: `New domain created: ${event.domain} by customer ${event.customerId} cc @Eric #general`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Hello, Assistant to the Regional Manager Dwight! *Michael Scott* wants to know where you'd like to take the Paper Company investors to dinner tonight.\n\n *Please select a restaurant:*",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Farmhouse Thai Cuisine*\n:star::star::star::star: 1528 reviews\n They do have some vegan options, like the roti and curry, plus they have a ton of salad stuff and noodles can be ordered without meat!! They have something for everyone here",
          },
          accessory: {
            type: "image",
            image_url:
              "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
            alt_text: "alt text for image",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Kin Khao*\n:star::star::star::star: 1638 reviews\n The sticky rice also goes wonderfully with the caramelized pork belly, which is absolutely melt-in-your-mouth and so soft.",
          },
          accessory: {
            type: "image",
            image_url:
              "https://s3-media2.fl.yelpcdn.com/bphoto/korel-1YjNtFtJlMTaC26A/o.jpg",
            alt_text: "alt text for image",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Ler Ros*\n:star::star::star::star: 2082 reviews\n I would really recommend the  Yum Koh Moo Yang - Spicy lime dressing and roasted quick marinated pork shoulder, basil leaves, chili & rice powder.",
          },
          accessory: {
            type: "image",
            image_url:
              "https://s3-media2.fl.yelpcdn.com/bphoto/DawwNigKJ2ckPeDeDM7jAg/o.jpg",
            alt_text: "alt text for image",
          },
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Farmhouse",
                emoji: true,
              },
              value: "click_me_123",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Kin Khao",
                emoji: true,
              },
              value: "click_me_123",
              url: "https://google.com",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Ler Ros",
                emoji: true,
              },
              value: "click_me_123",
              url: "https://google.com",
            },
          ],
        },
      ],
    });

    await ctx.waitFor("initial-wait", { seconds: 5 });

    await slack.postMessage("arnie", {
      username: "Arnie",
      icon_url:
        "https://www.themoviedb.org/t/p/w500/zEMhugsgXIpnQqO31GpAJYMUZZ1.jpg",
      channelName: "test-integrations",
      text: getRandomQuote(),
    });

    return {};
  },
}).listen();

function getRandomQuote() {
  const arnoldQuotes = [
    "I'll be back.",
    "Strength does not come from winning. Your struggles develop your strengths. When you go through hardships and decide not to surrender, that is strength.",
    "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it, as long as you really believe 100 percent.",
    "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.",
    "For me life is continuously being hungry. The meaning of life is not simply to exist, to survive, but to move ahead, to go up, to achieve, to conquer.",
    "The best activities for your health are pumping and humping.",
    "I have a love interest in every one of my films: a gun.",
    "You can have results or excuses, but not both.",
  ];

  return arnoldQuotes[Math.floor(Math.random() * arnoldQuotes.length)];
}

const BLOCK_ID = "issue.action.block";
const BLOCK_ID_RATING = "issue.rating.block";

new Trigger({
  id: "slack-interactivity",
  name: "Testing Slack Interactivity",
  apiKey: "trigger_dev_zC25mKNn6c0q",
  endpoint: "ws://localhost:8889/ws",
  logLevel: "debug",
  on: customEvent({
    name: "slack.interact",
    schema: z.any(),
  }),
  run: async (event, ctx) => {
    await slack.postMessage("jsx-test", {
      channelName: "test-integrations",
      text: "Test of jsx",
      blocks: JSXSlack(
        <Blocks>
          <Section>This is using jsxslack</Section>
          <Actions blockId={BLOCK_ID}>
            <Button value="close_issue" actionId="close_issue_123">
              Close Issue
            </Button>
            <Button value="comment_issue" actionId="comment_issue_123">
              Comment
            </Button>
            <Button
              value="view_issue"
              actionId="view_issue_123"
              url="https://github.com/triggerdotdev/trigger.dev/issues/11"
            >
              Comment
            </Button>
          </Actions>
          <Section blockId={BLOCK_ID_RATING}>
            Rate this experience
            <Select actionId="rating" placeholder="Rate it!">
              <Option value="5">5 {":star:".repeat(5)}</Option>
              <Option value="4">4 {":star:".repeat(4)}</Option>
              <Option value="3">3 {":star:".repeat(3)}</Option>
              <Option value="2">2 {":star:".repeat(2)}</Option>
              <Option value="1">1 {":star:".repeat(1)}</Option>
            </Select>
          </Section>
        </Blocks>
      ),
    });
  },
}).listen();

const BLOCK_ID_2 = "release.action.block";

new Trigger({
  id: "slack-block-interaction",
  name: "Slack Block Interaction",
  apiKey: "trigger_dev_zC25mKNn6c0q",
  endpoint: "ws://localhost:8889/ws",
  logLevel: "debug",
  on: slack.events.blockActionInteraction({
    blockId: BLOCK_ID,
    actionId: ["comment_issue_123", "close_issue_123"],
  }),
  run: async (event, ctx) => {
    await slack.postMessageResponse("Response to user", event.response_url, {
      text: `Thanks for clicking on the button!`,
      replace_original: false,
    });

    await slack.postMessageResponse("Respond to everyone", event.response_url, {
      text: `Now what do you want to do about the PR review?`,
      replace_original: false,
      response_type: "in_channel",
      blocks: [
        {
          type: "actions",
          block_id: BLOCK_ID_2,
          elements: [
            {
              type: "button",
              action_id: "submit_review_123",
              text: {
                type: "plain_text",
                text: "Submit Review",
                emoji: true,
              },
              value: "submit_review",
            },
            {
              type: "button",
              action_id: "close_review_123",
              text: {
                type: "plain_text",
                text: "Close Review",
                emoji: true,
              },
              value: "close_review",
            },
          ],
        },
      ],
    });
  },
}).listen();

new Trigger({
  id: "slack-block-interaction-rating",
  name: "Slack get rating",
  apiKey: "trigger_dev_zC25mKNn6c0q",
  endpoint: "ws://localhost:8889/ws",
  logLevel: "debug",
  on: slack.events.blockActionInteraction({
    blockId: BLOCK_ID_RATING,
    actionId: ["rating"],
  }),
  run: async (event, ctx) => {
    const ratingAction = event.actions.find((a) => a.action_id === "rating");

    if (ratingAction?.type === "static_select") {
      await slack.postMessageResponse("Response to user", event.response_url, {
        text: `Thanks for rating ${ratingAction.selected_option.value}!`,
        replace_original: false,
      });
    }
  },
}).listen();

new Trigger({
  id: "slack-block-interaction-2",
  name: "Slack Block Interaction 2",
  apiKey: "trigger_dev_zC25mKNn6c0q",
  endpoint: "ws://localhost:8889/ws",
  logLevel: "debug",
  on: slack.events.blockActionInteraction({
    blockId: BLOCK_ID_2,
  }),
  run: async (event, ctx) => {
    if (!event.message) {
      ctx.logger.debug(`No message found`);
      return;
    }

    await slack.addReaction("React to message", {
      name: "thumbsup",
      timestamp: event.message.ts,
      channelId: event.channel.id,
    });
  },
}).listen();
