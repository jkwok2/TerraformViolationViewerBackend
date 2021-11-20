use `database-1`;
drop table if exists Users;
drop table if exists Violations;
drop table if exists Rules;

create table Users(
                      userId varchar(45) primary key not null,
                      email varchar(45) not null,
                      username varchar(45),
                      givenName varchar(45) not null,
                      familyName varchar(45) not null,
                      userRole varchar(45)
);

create table Violations(
                           id int primary key not null auto_increment,
                           userId varchar(45) not null,
                           repoId varchar(45) not null,
                           prId varchar(45) not null,
                           filePath varchar(45) not null,
                           lineNumber int not null,
                           violationType varchar(45) not null,
                           violationTime datetime not null
);

create table Rules(
                      id int primary key not null auto_increment,
                      aws_resource_type varchar(180) not null,
                      has boolean,
                      has_key varchar(180),
                      has_value varchar(180),
                      has_range_beg varchar(90),
                      has_range_end varchar(90),
                      not_has boolean,
                      not_has_key varchar(180),
                      not_has_value varchar(180),
                      not_has_range_beg varchar(90),
                      not_has_range_end varchar(90),
                      status varchar(20)
);

insert into Users (userId, username, email, givenName, familyName, userRole) values ('111561841222565942402', 'HSBC Violation Viewer', 'hsbcviolationviewer@gmail.com', 'HSBC Violation Viewer', 'HSBC Violation Viewer', 'admin');
insert into Users (userId, username, email, givenName, familyName, userRole) values ('105989777376658273094', 'GokceDilek', 'cpsc319.fall2021@gmail.com', 'Gokce', 'Dilek', 'base');

insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('111561841222565942402', 'R123', '31234', './testfilepath', '123', 'Violation Type 1', '2020-08-24 13:45:23');
insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('111561841222565942402', 'R123', '31234', './testfilepath', '123', 'Violation Type 2', '2021-01-16 11:00:00');
insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('111561841222565942402', 'R124', '31235', './testfilepath', '123', 'Violation Type 1', '2021-02-13 16:06:56');
insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('105989777376658273094', 'R125', '31236', './testfilepath', '123', 'Violation Type 3', '2021-06-13 14:34:56');
insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('105989777376658273094', 'R124', '31237', './testfilepath', '123', 'Violation Type 2', '2021-02-13 12:42:56');
insert into Violations (userId, repoId, prId, filePath, lineNumber, violationType, violationTime) values ('105989777376658273094', 'R126', '31237', './testfilepath', '123', 'Violation Type 4', '2021-04-13 12:21:56');

insert into Rules (aws_resource_type, has, has_key, has_value, status) values ('aws_elb', TRUE, 'access_logs.enabled', 'true', 'active');
insert into Rules (aws_resource_type, has, has_key, has_value, status) values ('aws_s3_bucket_public_access_block', TRUE, 'block_public_policy', 'true', 'active');
insert into Rules (aws_resource_type, not_has, not_has_key, status) value ('aws_instance', TRUE, 'user_data', 'active');
insert into Rules (aws_resource_type, has, has_key, has_value, status) value ('aws_docdb_cluster_parameter_group', TRUE, 'parameter.audit_logs', 'enable', 'active');
insert into Rules (aws_resource_type, has, has_key, status) value ('aws_athena_workgroup', TRUE, 'configuration.result_configuration.encryption_configuration', 'active');
insert into Rules (aws_resource_type, has, has_key, has_range_beg, has_range_end, status) value ('aws_cloudfront_distribution', TRUE, 'default_cache_behavior.viewer_protocol_policy', 'redirect-to-https', 'https-only', 'active');

