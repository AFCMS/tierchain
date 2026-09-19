import {
  type APIContainerComponent,
  ComponentType,
  ButtonStyle,
  SeparatorSpacingSize,
} from "discord-api-types/v10";

export const emojiIds = {
  github: "1550543636557729823",
} as const satisfies Record<string, string>;

const mainText = `## Tierchain
**TierMaker** inspired, **Ethereum Sepolia** based platform.`;

export function getEmbed(appUrl: string) {
  return {
    type: ComponentType.Container,
    components: [
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: mainText,
          },
        ],
        accessory: {
          type: ComponentType.Button,
          label: "Open",
          url: appUrl,
          style: ButtonStyle.Link,
        },
      },
      {
        type: ComponentType.MediaGallery,
        items: [
          {
            media: {
              url: `${appUrl}/screenshot_16x9.png`,
            },
            description: "Tierchain - Browsers tierlist",
          },
        ],
      },
      {
        type: ComponentType.Separator,
        divider: true,
        spacing: SeparatorSpacingSize.Small,
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            label: "GitHub",
            emoji: {
              id: emojiIds.github,
              name: "github",
            },
            url: "https://github.com/AFCMS/tierchain",
            style: ButtonStyle.Link,
          },
          {
            type: ComponentType.Button,
            label: "More projects",
            emoji: {
              name: "🌐",
            },
            url: "https://afcms.dev",
            style: ButtonStyle.Link,
          },
        ],
      },
    ],
  } as const satisfies APIContainerComponent;
}
