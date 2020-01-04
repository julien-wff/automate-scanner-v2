module.exports.flows = `
    CREATE TABLE \`flows\`
    (
        \`id\`             int(10)                                                 NOT NULL,
        \`user_id\`        int(10)                                                 NOT NULL,
        \`category_id\`    int(10)                                                 NOT NULL,
        \`title\`          varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
        \`description\`    text CHARACTER SET utf8 COLLATE utf8_general_ci         NOT NULL,
        \`downloads\`      int(20)                                                 NOT NULL,
        \`featured\`       boolean                                                 NOT NULL,
        \`created\`        datetime                                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`modified\`       timestamp                                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`upload-version\` int(10)                                                 NOT NULL,
        \`data-version\`   int(10)                                                 NOT NULL,
        \`base64-data\`    text CHARACTER SET utf8 COLLATE utf8_general_ci         NOT NULL,
        PRIMARY KEY (\`id\`)
    ) ENGINE = InnoDB
      DEFAULT CHARSET = utf8;
`;


module.exports.reviews = `
    CREATE TABLE \`reviews\`
    (
        \`id\`       int(10)                                         NOT NULL,
        \`flow_id\`  int(10)                                         NOT NULL,
        \`user_id\`  int(10)                                         NOT NULL,
        \`rating\`   int(1)                                          NOT NULL,
        \`comment\`  text CHARACTER SET utf8 COLLATE utf8_general_ci NULL     DEFAULT NULL,
        \`created\`  datetime                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`modified\` datetime                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
    ) ENGINE = InnoDB
      DEFAULT CHARSET = utf8;
`;
