require('dotenv').config();

const { App } = require('@slack/bolt');
const { Pool } = require("pg");

const DEBUG = false;

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST, // TODO isn't there a better way to access the database host?
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});


const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

async function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
async function sleep(seconds) {
    msleep(seconds*1000);
}

async function getConversationHistory(channel_id) {
    let messagesPerPage = 200;
    let maxMessages = 400;
    let allMessages = [];
    let hasMoreRecords = true;

    let cursor;

    while ((allMessages.length + messagesPerPage <= maxMessages) && hasMoreRecords) {
        let options = {token: process.env.SLACK_BOT_TOKEN, channel: channel_id, limit: messagesPerPage};
        if(cursor){
            let cursorObj = {cursor:cursor};
            options = {...options, ...cursorObj}
        }

        let {messagesArray, nextCursor, hasMore} = await queryConversationsPage(options);
        hasMoreRecords = !!hasMore;
        cursor = nextCursor;

        allMessages.push(...messagesArray);

        if (DEBUG) {
            console.log("messages: " + messagesArray);
            console.log("next cursor: " + cursor);
            console.log("has more: " + hasMore);
            console.log("all message length: " + allMessages.length);
            console.log("messages per page: " + messagesPerPage);
        }

        await sleep(15);

    }
    return allMessages;
}

async function queryConversationsPage(options) {
    try {
        const result = await app.client.conversations.history(options);
        return { messagesArray: result.messages, nextCursor: result.response_metadata.next_cursor, hasMore: result.has_more };
    } catch (error) {
        console.error(error);
    }
}


async function getUserInfo(){
    try {
        const result = await app.client.users.list({
            token: process.env.SLACK_BOT_TOKEN,
        });
        return result.members;
    } catch (error) {
        console.error(error);
    }
}

async function getChannelReplyCount(timestamp) {
    let NO_REPLY_COUNT = 0;
    try {
        const result = await app.client.conversations.replies({
            token: process.env.SLACK_BOT_TOKEN,
            channel: process.env.SLACK_CHANNEL_ID,
            ts: timestamp
        });
        return result.messages[0].reply_count ? result.messages[0].reply_count : NO_REPLY_COUNT
    } catch (error) {
        console.error(error);
        return NO_REPLY_COUNT;
    }
}

async function getReactionCount(timestamp) {
    let NO_REACTION_COUNT = 0;
    try {
        const result = await app.client.reactions.get({
            // The token you used to initialize your app
            token: process.env.SLACK_BOT_TOKEN,
            channel: process.env.SLACK_CHANNEL_ID,
            timestamp: timestamp
        });
        return result.message.reactions ? result.message.reactions.length : NO_REACTION_COUNT
    } catch (error) {
        console.error(error);
        return NO_REACTION_COUNT;
    }
}

async function saveConversationsToDatabase(messageList){
    messageList.forEach(async function (message) {

        let reactionCount = await getReactionCount(message.ts);
        let channelReplyCount = await getChannelReplyCount(message.ts);

        //TODO need to encode only urls
        pool.query(`INSERT INTO conversation_history(u_id, u_text, u_timestamp, u_reaction_count, u_replies) VALUES ($1, $2, $3, $4, $5)`,
            [message.user, encodeURIComponent(message.text), message.ts, Number(channelReplyCount), Number(reactionCount)], (err, res) => {
                console.log(err, res);
            }
        );
    });
}

async function saveUsersToDatabase(userList){
    userList.forEach(function (user) {
        pool.query(`INSERT INTO user_info(u_id, u_real_name) VALUES ($1, $2)`, [user.id,
                user.real_name], (err, res) => {
                console.log(err, res);
            }
        );
    });
}
(async () => {
    // Start your app
    await app.start(process.env.PORT || process.env.NODE_APP_PORT);

    console.log('⚡️ Bolt app is running!');

    let allMessageHistory = await getConversationHistory(process.env.SLACK_CHANNEL_ID);

    await saveConversationsToDatabase(allMessageHistory);

    let allUsers = await getUserInfo();

    await saveUsersToDatabase(allUsers);

})();
