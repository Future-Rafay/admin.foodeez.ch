SELECT
  `foodeez`.`foodeez_review`.`FOODEEZ_REVIEW_ID` AS `FOODEEZ_REVIEW_ID`,
  `foodeez`.`foodeez_review`.`CREATION_DATETIME` AS `CREATION_DATETIME`,
  `foodeez`.`foodeez_review`.`REVIEWER_NAME` AS `REVIEWER_NAME`,
  `foodeez`.`foodeez_review`.`REVIEWER_EMAIL` AS `REVIEWER_EMAIL`,
  `foodeez`.`foodeez_review`.`AVATAR` AS `AVATAR`,
  `foodeez`.`foodeez_review`.`RATING` AS `RATING`,
  `foodeez`.`foodeez_review`.`REVIEW` AS `REVIEW`,
  `foodeez`.`foodeez_review`.`PIC_1` AS `PIC_1`,
  `foodeez`.`foodeez_review`.`PIC_2` AS `PIC_2`,
  `foodeez`.`foodeez_review`.`PIC_3` AS `PIC_3`,
  `foodeez`.`foodeez_review`.`APPROVED` AS `APPROVED`
FROM
  `foodeez`.`foodeez_review`