CREATE TABLE user_info (
 id             SERIAL PRIMARY KEY,
 u_id           text NULL,
 u_real_name    text NULL
);

CREATE TABLE conversation_history (
 id               SERIAL PRIMARY KEY,
 u_id             text NULL,
 u_text           text NULL,
 u_timestamp      text NULL,
 u_reaction_count INTEGER,
 u_replies        INTEGER
);