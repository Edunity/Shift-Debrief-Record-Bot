import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = ai.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once("ready", () => {
    console.log("woke up.");
});

client.on("messageCreate", async (message) => {
    try {
        if (message.author.bot) {
            return;
        }

        if (message.content.toLowerCase().includes("test")) {
            await message.react("🏓");
        }
        else {
            if(message.attachments.size > 0) {
                const images = message.attachments.filter(item =>
                    item.contentType?.startsWith("image/") || item.name?.match(/.(jpg|jpeg|png|gif)$/i)
                );

                if (images.size > 0) {
                    const image = images.first();
                    const imageUrl = image.url;

                    // 画像を取得して base64 に変換
                    const response = await fetch(imageUrl);
                    const buffer = await response.arrayBuffer();
                    const base64Image = Buffer.from(buffer).toString("base64");

                    const prompt = `
                    この画像の中から「Highlights」という見出しの欄を探して、その欄に書かれている文字だけを抽出してください。
                    余計な説明や前置きは不要です。テキストのみ返してください。
                    `;

                    const result = await model.generateContent([
                        {
                            text: prompt,
                        },
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: image.contentType || "image/png",
                            },
                        },
                    ]);

                    const text = result.response.text();

                    await message.reply(text || "highlights欄が見つかりませんでした。");
                }
                else {

                }
            }
            else {
                const result = await model.generateContent(message.content);
                const text = result.response.text();

                await message.reply(text);
            }
        }
    } catch (error) {
        await message.reply("error.");

        console.error(error);
    }
});

app.get("/", (req, res) => {
    res.json({
        status: "Bot is running",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log("Starting server on port " + PORT);
});

client.login(process.env.DISCORD_TOKEN);