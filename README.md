# Motivations

Create quantifiable stats of messages in slack channels

# Prerequisites

You will need to enable a slackbot into your slack workspace with the following permissions
```text
channels:history
channels:read
emoji:read
groups:history
im:history
mpim:history
reactions:read
users:read
```


# Usage

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

1) Run the database and execute the node app 
```bash
docker-compose down --remove-orphans --volumes && docker-compose up -d
```

1) Log into the postgres client 
```bash
docker exec -it <POSTGRES_HOST> psql -U <POSTGRES_USER> <POSTGRES_PASSWORD>
```

1) Run some sample queries to get slack stats

Example SQL commands:

All users (real names)
```postgresql
select u_real_name from user_info;
```

All users and messages
```postgresql
select u_real_name, u_text FROM user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id;
```

Users with the most replies
```postgresql
select user_info.u_real_name, sum(u_replies) as Num_Replies from user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id group by user_info.u_real_name ORDER BY num_replies DESC;
```

Users with the most reactions
```postgresql
select user_info.u_real_name, sum(u_reaction_count) as Num_Reactions from user_info INNER JOIN conversation_history ON user_info.u_id = conversation_history.u_id group by user_info.u_real_name ORDER BY num_reactions DESC;
```

Comments with the most replies
```postgresql
select u_text, u_replies from conversation_history order by u_replies DESC;
```

# Database Schema

## user_info table

|                    id             |  u_id    |       u_real_name      | 
|-----------------------------------|----------|------------------------|
| 1                                 | CXCZVS   | Devin Brown            |
| 2                                 | ADFASD   | Jessica Banks          |

## conversation_history table

|                    id             |  u_id   |           u_text                  | u_timestamp      | u_reaction_count | u_replies |
|-----------------------------------|---------|-----------------------------------|------------------|------------------|-----------|
| 1                                 | CXCZVS  | Here is a link to the study notes |1595548456.000200 | 1                |0          |
| 2                                 | ADFASD  | MR #90 has been approved          |1595548451.000300 | 3                |0          |

# TODO
Look into the rate limiting problems. Would prefer to not see auto retry errors in the logs