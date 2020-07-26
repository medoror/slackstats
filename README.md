Motivations:

Joined a team that uses slack in a very custom way.  Every single build reports to a specific channel from via slackbot/jenkins
integrations.  This same chanel is also used by devs as a the main place to collaborate

Saying that this channel is noisy is an under statement

I think most people on the team felt the same way.

But management did not feel the same way.  There were historical reasons why this slack channel was the way it was.

But I felt like if I quantified my feelings, them maybe I would have some inroads in discussing ways to mitigate the noise

``Do we need this slackbot to output jenkins failuers to this channel? Do we really? How many times do we interact with
this notification?``

USAGE:

Configure the slack channel in the Dockerfile or docker compose

1) Clone this repo

1) This repo uses a `.env` file to pass slack secrets create a `.env` with the following contents
```.env
SLACK_SIGNING_SECRET=<Enter-slackbot-secret-here>
SLACK_BOT_TOKEN=<Enter-slackbot-token-here>
SLACK_CHANNEL_ID=<Enter slack channel ID>
NODE_APP_PORT=<Enter node app port>
POSTGRES_DB=<Enter postgres database name>
POSTGRES_USER=<Enter postgres database user>
POSTGRES_PASSWORD=<Enter postgres database password>
POSTGRES_PORT=<Enter postgres port>
POSTGRES_HOST=<Enter the database hostname>
```

1) Run the database and execute the node app `docker-compose down --remove-orphans --volumes && docker-compose up -d`

1) Log into the postgres client `docker exec -it <POSTGRES_HOST> psql -U <POSTGRES_USER> <POSTGRES_PASSWORD>`

1) Run some sample queries to get slack stats

Example SQL commands:

All users (real name)
```postgresql
select u_real_name from user_info;
```

Users with messages
```postgresql
select u_real_name, u_text FROM user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id;
```

Users with the most replies
```postgresql
select user_info.u_real_name, sum(u_replies) as Num_Replies from user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id group by user_info.u_real_name ORDER BY num_reactions DESC
```

Users with the most reactions
```postgresql
select user_info.u_real_name, sum(u_reaction_count) as Num_Reactions from user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id group by user_info.u_real_name ORDER BY num_reactions DESC
```

Comments with the most replies
```postgresql
select u_text, u_replies from conversation_history;
```

# Database Schema
## user_info table

|                    id             |  u_id    |       u_real_name      | 
|-----------------------------------|----------|------------------------|
| 1                                 | CXCZVS   | Devin Brown            |
| 2                                 | ADFASD   | Jessica Banks          |

## conversation_history table

|                    id             |  u_id   |           u_text                  | u_timestamp      | u_reaction_count | u_replies |
|-----------------------------------|---------|-----------------------------------|-------------------------------------|-----------|
| 1                                 | CXCZVS  | Here is a link to the study notes |1595548456.000200 | 1                |0          |
| 2                                 | ADFASD  | MR #90 has been approved          |1595548451.000300 | 3                |0          |


TODO: Fix conversation replies as they are not returning info for "bad timestamps"

References

- Steps to create a slack bot with bolt: https://slack.dev/bolt-js/tutorial/getting-started
- pg node example: https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/
- docker compose networking: https://docs.docker.com/compose/networking/
- docker compose: https://rollout.io/blog/using-docker-compose-for-nodejs-development/
