-- SELECT * FROM `database-1`.`Violations`;

--
-- SELECT a.name, a.projId, b.totalProjectMember 
-- FROM tblEmp a
-- JOIN (SELECT projId, Count(*) AS totalProjectMember 
--       FROM tblEmp 
--       GROUP BY projId) b
-- ON a.projId = b.projId
--
-- GET /violations
select * from `database-1`.`Violations`;

-- GET /violations?repoId=*
SELECT COUNT(*), repoId FROM `database-1`.`Violations` GROUP BY repoId;

-- GET /violations?type=*
SELECT COUNT(*), violationType FROM `database-1`.`Violations` GROUP BY violationType;

-- GET /violations?userId=*&type=*
-- OUTER: USER
-- INNER: TYPE
-- SELECT COUNT(*), userId, violationType FROM (SELECT * FROM `database-1`.`Violations` GROUP BY violationType) t1 GROUP BY userId;
SELECT * FROM `database-1`.`Violations` GROUP BY violationType;
-- SELECT *, COUNT(userId) FROM `database-1`.`Violations` db1  JOIN (SELECT * from `database-1`.`Users` 

-- SELECT *, COUNT(userId) FROM `database-1`.`Violations` GROUP BY userId;
-- SELECT COUNT(*), userId FROM `database-1`.`Violations` GROUP BY userId;


