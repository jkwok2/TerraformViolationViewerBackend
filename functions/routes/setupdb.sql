use `database-1`;
drop table if exists Users;
drop table if exists Violations;
drop table if exists Rules;

create table Users(userId varchar(45) primary key not null,
                   email varchar(90) not null,
                   username varchar(45),
                   givenName varchar(45) not null,
                   familyName varchar(45) not null,
                   userRole varchar(45)
);

create table Violations(violationId int primary key not null auto_increment,
                        userId varchar(45) not null,
                        repoId varchar(45) not null,
                        prId varchar(45) not null,
                        filePath varchar(120) not null,
                        lineNumber int not null,
                        ruleId int not null,
                        prTime datetime not null,
                        dateFound date not null
);

# ALTER TABLE `database-1`.`Violations`
#     ADD INDEX `userId_idx` (`userId` ASC) VISIBLE;
# ALTER TABLE `database-1`.`Violations`
#     ADD CONSTRAINT `userId` FOREIGN KEY (`userId`) REFERENCES `database-1`.`Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

create table Rules(ruleId int primary key not null auto_increment,
                   fileId  varchar(255) not null,
                   awsresource varchar(90) not null,
                   severity varchar(45) not null,
                   violationCategory varchar(45) not null,
                   status varchar(45) not null,
                   description varchar(255),
                   dateAdded datetime,
                   content TEXT not null
);

insert into Users (userId, username, email, givenName, familyName, userRole) values ('111561841222565942402', 'ViolationViewer', 'hsbcviolationviewer@gmail.com', 'HSBC Violation Viewer', 'HSBC Violation Viewer', 'admin');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('105989777376658273094', 'GokceDilek', 'cpsc319.fall2021@gmail.com', 'Gokce', 'Dilek', 'base');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('102758057491135810361', 'some.cpsc319.test@gmail.com', 'marquesarthur', 'CPSC319', 'Test', 'admin');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('102941678341377090736', 'branden5000@gmail.com', 'brandensiegle', 'Branden Kensington', 'Siegle', 'admin');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('105966689851359954303', 'megthibodeau@gmail.com', 'mthibodeau', 'Meg', 'undefined', 'admin');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('117445523220242747228', 'jerryjim.cad@gmail.com', 'CPSC319-2020', 'Jerry', 'Jim', 'admin');


insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('111561841222565942402', 'R123', '31234', './testfilepath', 123, 1, '2020-08-24 13:45:23', '2020-08-24');
insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('111561841222565942402', 'R123', '31234', './testfilepath', 123, 2, '2021-01-16 11:00:00', '2015-11-16');
insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('111561841222565942402', 'R124', '31235', './testfilepath', 123, 1, '2021-02-13 16:06:56', '2017-05-12');
insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('105989777376658273094', 'R125', '31236', './testfilepath', 123, 3, '2021-06-13 14:34:56', '2012-02-19');
insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('105989777376658273094', 'R124', '31237', './testfilepath', 123, 6, '2021-02-13 12:42:56', '2020-05-20');
insert into Violations (userId, repoId, prId, filePath, lineNumber, ruleId, prTime, dateFound) values ('105989777376658273094', 'R126', '31237', './testfilepath', 123, 5, '2021-04-13 12:21:56', '2020-08-21');

INSERT INTO Rules (fileId,awsresource,severity,violationCategory,status,description, dateAdded, content) VALUES
('bc_aws_s3_20.yaml','aws_s3_bucket_public_access_block','MEDIUM','STORAGE','active',NULL,'2021-11-13 12:21:56','resource: aws_s3_bucket_public_access_block
severity: MEDIUM
category: STORAGE
has:
  - key: "block_public_policy"
    value: true
'),
('bc_aws_s3_20.yaml','aws_s3_bucket_public_access_block','MEDIUM','STORAGE','active',NULL,'2021-11-14 12:21:56','resource: aws_s3_bucket_public_access_block
severity: MEDIUM
category: STORAGE
has:
  - key: "block_public_policy"
    value: true
'),
('ensure-docdb-has-audit-logs-enabled.yaml','aws_docdb_cluster_parameter_group','LOW','STORAGE','active',NULL,'2021-11-15 12:21:56','resource: aws_docdb_cluster_parameter_group
severity: LOW
category: STORAGE
has:
  - key: "parameter.audit_logs"
    value: "enable"
'),
('s3_7-acl-write-permissions-aws.yaml','aws_s3_bucket.data','CRITICAL','STORAGE','active',NULL,'2021-11-16 12:21:56','resource: aws_s3_bucket.data
severity: CRITICAL
category: STORAGE
has_not:
  - key: "acl"
    value: "public-write"
'),
('networking_31.yaml','aws_security_group','LOW','NETWORKING','active',NULL,'2021-11-17 12:21:56','resource: aws_security_group
severity: LOW
category: NETWORKING
has:
  - key: "ingress.description"
'),
('bc_aws_logging_24.yaml','aws_elb','HIGH','LOGGING','active',NULL,'2021-11-18 12:21:56','resource: aws_elb
severity: HIGH
category: LOGGING
has:
  - key: "access_logs.enabled"
    value: true
'),
('yutian-test.yaml','aws_athena_workgroup','MEDIUM','GENERAL','active',NULL,'2021-11-18 12:21:56','resource: aws_athena_workgroup
severity: MEDIUM
category: GENERAL
has:
  - key: "configuration.result_configuration.encryption_configuration"
'),
('yutian-test.yaml','aws_security_group','MEDIUM','NETWORKING','active',NULL,'2021-11-18 12:21:56','resource: aws_security_group
severity: MEDIUM
category: NETWORKING
has:
  - key: "ingress.cidr_blocks"
    value: "0.0.0.0/0"
'),
('yutian-test.yaml','aws_cloudfront_distribution','MEDIUM','NETWORKING','active',NULL,'2021-11-18 12:21:56','resource: aws_cloudfront_distribution
severity: MEDIUM
category: NETWORKING
has:
  - key: "default_cache_behavior.viewer_protocol_policy"
    range: ["redirect-to-https", "https-only"]
');