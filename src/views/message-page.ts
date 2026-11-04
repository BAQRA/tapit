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

/**
 * A small, branded, standalone page in the TapIT palette (light and dark).
 * The app icon (/favicon.svg, white tile) reads well on both backgrounds.
 * `html` escapes the interpolated values.
 */
export const renderMessagePage = ({ title, text }: Message) =>
  html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title>${title} · TapIT</title>
        <style>
          :root {
            --bg: #f4f5f9;
            --panel: #ffffff;
            --text: #1b1f2b;
            --muted: #5e6474;
            --line: #e2e4ec;
            --link: #4f63f0;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #12141c;
              --panel: #1b1f2b;
              --text: #eceef4;
              --muted: #9aa0b2;
              --line: #2b3040;
              --link: #8293f7;
            }
          }
          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }
          body {
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 16px;
            background: var(--bg);
            color: var(--text);
            font:
              16px/1.5 system-ui,
              -apple-system,
              "Segoe UI",
              sans-serif;
          }
          main {
            width: min(360px, 100%);
            padding: 32px 24px;
            text-align: center;
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 16px;
          }
          main img {
            display: block;
            margin: 0 auto 16px;
            border-radius: 16px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 20px;
          }
          p {
            margin: 0;
            color: var(--muted);
          }
          footer {
            position: fixed;
            right: 0;
            bottom: 20px;
            left: 0;
            text-align: center;
            font-size: 13px;
            color: var(--muted);
          }
          footer a {
            color: var(--link);
            font-weight: 600;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <main>
          <img src="/favicon.svg" alt="" width="64" height="64" />
          <h1>${title}</h1>
          <p>${text}</p>
        </main>
        <footer>NFC review cards by <a href="https://tapit.ge">TapIT.ge</a></footer>
      </body>
    </html>`;

export const messageResponse = (c: Context, message: Message, status: ContentfulStatusCode = 200) =>
  c.html(renderMessagePage(message), status, { "cache-control": "no-store" });
