import type { Context } from "hono";
import { html } from "hono/html";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Message {
  title: string;
  text: string;
}

/** Texts shown to someone who taps a card that can't redirect. */
export const MESSAGES = {
  cardNotFound: { title: "Card not found", text: "This card isn't registered." },
  cardNotSetUp: { title: "Almost ready", text: "This card hasn't been set up yet." },
  cardInactive: { title: "Card inactive", text: "This card is currently not active." },
  ownerLinkInvalid: {
    title: "Link not active",
    text: "This dashboard link is no longer valid. Please contact TapIT.",
  },
} satisfies Record<string, Message>;

/** A small, branded, standalone page. `html` escapes the interpolated values. */
export const renderMessagePage = ({ title, text }: Message) =>
  html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title} · TapIT</title>
        <style>
          body {
            font:
              16px system-ui,
              sans-serif;
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f6f6f4;
            color: #222;
          }
          main {
            text-align: center;
            padding: 24px;
          }
          h1 {
            font-size: 20px;
            margin: 0 0 8px;
          }
          p {
            margin: 0;
            color: #666;
          }
          footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 13px;
            color: #999;
          }
          footer a {
            color: inherit;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p>${text}</p>
        </main>
        <footer>NFC review cards by <a href="https://tapit.ge">TapIT.ge</a></footer>
      </body>
    </html>`;

export const messageResponse = (c: Context, message: Message, status: ContentfulStatusCode = 200) =>
  c.html(renderMessagePage(message), status, { "cache-control": "no-store" });
