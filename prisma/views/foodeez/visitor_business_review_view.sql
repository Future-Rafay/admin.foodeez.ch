SELECT
  `foodeez`.`visitor_business_review`.`VISITOR_BUSINESS_REVIEW_ID` AS `VISITOR_BUSINESS_REVIEW_ID`,
  `foodeez`.`visitor_business_review`.`CREATION_DATETIME` AS `CREATION_DATETIME`,
  `foodeez`.`visitor_business_review`.`VISITORS_ACCOUNT_ID` AS `VISITORS_ACCOUNT_ID`,
  `foodeez`.`visitors_account`.`FIRST_NAME` AS `FIRST_NAME`,
  `foodeez`.`visitors_account`.`LAST_NAME` AS `LAST_NAME`,
  `foodeez`.`visitors_account`.`PIC` AS `PIC`,
  `foodeez`.`visitor_business_review`.`BUSINESS_ID` AS `BUSINESS_ID`,
  `foodeez`.`visitor_business_review`.`RATING` AS `RATING`,
  IFNULL(`foodeez`.`visitor_business_review`.`REMARKS`, '') AS `REMARKS`,
  `foodeez`.`visitor_business_review`.`PIC_1` AS `PIC_1`,
  `foodeez`.`visitor_business_review`.`PIC_2` AS `PIC_2`,
  `foodeez`.`visitor_business_review`.`PIC_3` AS `PIC_3`,
  `foodeez`.`visitor_business_review`.`PIC_4` AS `PIC_4`,
  `foodeez`.`visitor_business_review`.`PIC_5` AS `PIC_5`,
  `foodeez`.`visitor_business_review`.`PIC_6` AS `PIC_6`,
  `foodeez`.`visitor_business_review`.`PIC_7` AS `PIC_7`,
  `foodeez`.`visitor_business_review`.`PIC_8` AS `PIC_8`,
  `foodeez`.`visitor_business_review`.`PIC_9` AS `PIC_9`,
  `foodeez`.`visitor_business_review`.`PIC_10` AS `PIC_10`,
  `foodeez`.`visitor_business_review`.`VIDEO_1` AS `VIDEO_1`,
  `foodeez`.`visitor_business_review`.`LIKE_COUNT` AS `LIKE_COUNT`,
  `foodeez`.`visitor_business_review`.`APPROVED` AS `APPROVED`
FROM
  (
    `foodeez`.`visitor_business_review`
    JOIN `foodeez`.`visitors_account`
  )
WHERE
  (
    `foodeez`.`visitor_business_review`.`VISITORS_ACCOUNT_ID` = `foodeez`.`visitors_account`.`VISITORS_ACCOUNT_ID`
  )