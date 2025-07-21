SELECT
  `foodeez`.`adlinks`.`ADLINK_ID` AS `ADLINK_ID`,
  `foodeez`.`adlinks`.`BUSINESS_NAME` AS `BUSINESS_NAME`,
  `foodeez`.`adlinks`.`LOGO_FILE` AS `LOGO_FILE`,
  `foodeez`.`adlinks`.`WEB_ADDRESS` AS `WEB_ADDRESS`
FROM
  `foodeez`.`adlinks`
WHERE
  (
    (`foodeez`.`adlinks`.`ACTIVE` = 1)
    AND (`foodeez`.`adlinks`.`APPROVED` = 1)
    AND (
      curdate() BETWEEN IFNULL(
        `foodeez`.`adlinks`.`DATE_FROM`,
(curdate() + INTERVAL -(1) DAY)
      )
      AND IFNULL(
        `foodeez`.`adlinks`.`DATE_TO`,
(curdate() + INTERVAL 365 DAY)
      )
    )
  )
ORDER BY
  `foodeez`.`adlinks`.`SEQ`